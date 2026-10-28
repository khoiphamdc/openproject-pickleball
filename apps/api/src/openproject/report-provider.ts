import { env } from "../config/env.js";
import { AppError } from "../shared/errors.js";
import {
    configureReportDatasetProvider,
    type ReportDatasetProvider,
} from "../routes/reports.js";
import type {
    DefectSnapshot,
    ReportDataset,
    TaskSnapshot,
} from "../analytics/report.js";

interface OpenProjectLink {
    href?: string;
    title?: string;
}

interface OpenProjectWorkPackage {
    id: number;
  createdAt?: string;
    subject?: string;
    storyPoints?: number | null;
    startDate?: string | null;
    dueDate?: string | null;
    _links?: {
        type?: OpenProjectLink;
        status?: OpenProjectLink;
        parent?: OpenProjectLink;
        assignee?: OpenProjectLink;
        priority?: OpenProjectLink;
        project?: OpenProjectLink;
    };
}

async function fetchAcceptedAt(workPackages: OpenProjectWorkPackage[]): Promise<Map<number, string>> {
    const baseUrl = env.openprojectUrl.replace(/\/+$/, "");
    const auth = "Basic " + Buffer.from(`apikey:${env.openprojectToken}`).toString("base64");
    const candidates = workPackages.filter(w => ["TASK", "SUBTASK"].includes(w._links?.type?.title?.toUpperCase() ?? "") && w._links?.status?.title?.trim().toUpperCase() === "DONE");
    const entries = await Promise.all(candidates.map(async work => {
        try {
            const response = await fetch(`${baseUrl}/api/v3/work_packages/${work.id}/activities?pageSize=100`, { headers: { Authorization: auth, Accept: "application/hal+json" }, signal: AbortSignal.timeout(10_000) });
            if (!response.ok) return [work.id, null] as const;
            const body = await response.json() as { _embedded?: { elements?: Array<{ createdAt?: string; details?: Array<{ raw?: string }> }> } };
            const acts = body._embedded?.elements ?? [];
            const done = acts.filter(a => a.details?.some(d => /status (set to|changed to) done/i.test(d.raw ?? ""))).sort((a,b) => Date.parse(b.createdAt ?? "")-Date.parse(a.createdAt ?? ""))[0];
            return [work.id, done?.createdAt ?? (work.createdAt ?? null)] as const;
        } catch { return [work.id, work.createdAt ?? null] as const; }
    }));
    return new Map(entries.filter((entry): entry is readonly [number, string] => entry[1] !== null));
}

interface OpenProjectCollection {
    count?: number;
    total?: number;
    _embedded?: {
        elements?: OpenProjectWorkPackage[];
    };
}

function getLinkedId(href?: string): number | null {
    if (!href) return null;

    const match = href.match(/\/work_packages\/(\d+)(?:\/)?$/);

    if (match) {
        return Number(match[1]);
    }

    const genericMatch = href.match(/\/(\d+)(?:\/)?$/);

    return genericMatch ? Number(genericMatch[1]) : null;
}

function getStatus(
    workPackage: OpenProjectWorkPackage,
): string {
    return workPackage._links?.status?.title?.trim() ?? "UNKNOWN";
}

function getType(
    workPackage: OpenProjectWorkPackage,
): string {
    return workPackage._links?.type?.title?.trim() ?? "UNKNOWN";
}

function getParentId(
    workPackage: OpenProjectWorkPackage,
): number | null {
    return getLinkedId(workPackage._links?.parent?.href);
}

function getUserId(href?: string): number | null {
    const match = href?.match(/\/users\/(\d+)\/?$/);
    return match ? Number(match[1]) : null;
}

function severityFromPriority(priority?: string): DefectSnapshot["severity"] {
    switch (priority?.trim().toUpperCase()) {
        case "LOW": return "Low";
        case "HIGH": return "High";
        case "IMMEDIATE":
        case "CRITICAL": return "Critical";
        default: return "Medium";
    }
}

async function fetchWorkPackages(
    projectId: number,
): Promise<OpenProjectWorkPackage[]> {
    const baseUrl = env.openprojectUrl.replace(/\/+$/, "");

    const pageSize = 100;
    let offset = 1;
    let total = Number.POSITIVE_INFINITY;

    const result: OpenProjectWorkPackage[] = [];
    const seenIds = new Set<number>();

    while (result.length < total) {
        const url = new URL(
            `${baseUrl}/api/v3/projects/${projectId}/work_packages`,
        );

        url.searchParams.set("offset", String(offset));
        url.searchParams.set("pageSize", String(pageSize));
        url.searchParams.set("filters", "[]");
        url.searchParams.set("sortBy", '[["id","asc"]]');

        let response: Response;
        try {
            response = await fetch(url, {
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(
                        `apikey:${env.openprojectToken}`,
                    ).toString("base64"),
                Accept: "application/hal+json",
            },
            // OpenProject can take over a minute on large/demo projects; a
            // short timeout turns a slow but successful page into HTTP 503.
            signal: AbortSignal.timeout(120_000),
            });
        } catch {
            throw new AppError("OPENPROJECT_UNAVAILABLE", "Không kết nối được OpenProject.", 503);
        }

        if (!response.ok) {
            if (response.status === 404) throw new AppError("PROJECT_NOT_FOUND", "Không tìm thấy dự án hoặc tài khoản không có quyền xem.", 404);
            throw new AppError("OPENPROJECT_ERROR", `OpenProject trả HTTP ${response.status}.`, 502);
        }

        const payload =
            (await response.json()) as OpenProjectCollection;

        if (!Number.isSafeInteger(payload.total) || (payload.total as number) < 0 || !Array.isArray(payload._embedded?.elements)) {
            throw new Error("OpenProject returned an invalid work package collection");
        }
        const elements = payload._embedded.elements;

        for (const item of elements) {
            if (!Number.isSafeInteger(item.id) || seenIds.has(item.id)) {
                throw new Error("OpenProject returned duplicate or invalid work package IDs while paging");
            }
            seenIds.add(item.id);
        }

        result.push(...elements);

        total = payload.total as number;

        if (elements.length === 0 && result.length < total) {
            throw new Error("OpenProject returned an incomplete paginated result");
        }
        offset += 1;
    }

    return result;
}

export interface WorkPackageListItem {
    id: number;
    subject: string;
    type: string;
    status: string;
    parentId: number | null;
    epicId: number | null;
    epicSubject: string | null;
    currentAssigneeId: number | null;
    currentAssigneeName: string | null;
    dueDate: string | null;
    startDate: string | null;
    storyPoints: number | null;
    priority: string | null;
}

function toWorkPackageListItems(workPackages: OpenProjectWorkPackage[]): WorkPackageListItem[] {
    const byId = new Map(workPackages.map(item => [item.id, item]));
    function findEpic(item: OpenProjectWorkPackage): OpenProjectWorkPackage | null {
        if (getType(item).trim().toUpperCase() === "EPIC") return item;
        let parentId = getParentId(item);
        const visited = new Set<number>();
        while (parentId !== null && !visited.has(parentId)) {
            visited.add(parentId);
            const parent = byId.get(parentId);
            if (!parent) return null;
            if (getType(parent).trim().toUpperCase() === "EPIC") return parent;
            parentId = getParentId(parent);
        }
        return null;
    }
    const visibleTypes = new Set(["EPIC", "STORY", "TASK", "SUBTASK", "BUG"]);
    return workPackages.flatMap(item => {
        const type = getType(item);
        if (!visibleTypes.has(type.trim().toUpperCase())) return [];
        const epic = findEpic(item);
        return [{
            id: item.id,
            subject: item.subject ?? "",
            type,
            status: getStatus(item),
            parentId: getParentId(item),
            epicId: epic?.id ?? null,
            epicSubject: epic?.subject ?? null,
            currentAssigneeId: getUserId(item._links?.assignee?.href),
            currentAssigneeName: item._links?.assignee?.title ?? null,
            dueDate: item.dueDate ?? null,
            startDate: item.startDate ?? null,
            storyPoints: item.storyPoints ?? null,
            priority: item._links?.priority?.title ?? null,
        }];
    });
}

function toTaskSnapshots(
    workPackages: OpenProjectWorkPackage[],
    acceptedDates: Map<number, string>,
): TaskSnapshot[] {
    const byId = new Map(workPackages.map(item => [item.id, item]));
    function findEpic(workPackage: OpenProjectWorkPackage): OpenProjectWorkPackage | null {
        let parentId = getParentId(workPackage);
        const visited = new Set<number>();
        while (parentId !== null && !visited.has(parentId)) {
            visited.add(parentId);
            const parent = byId.get(parentId);
            if (!parent) return null;
            if (getType(parent).trim().toUpperCase() === "EPIC") return parent;
            parentId = getParentId(parent);
        }
        return null;
    }
    const parentIds = new Set<number>();

    for (const workPackage of workPackages) {
        const parentId = getParentId(workPackage);

        if (parentId !== null && getType(workPackage).toUpperCase() === "SUBTASK") {
            parentIds.add(parentId);
        }
    }

    return workPackages.flatMap((workPackage) => {
        const type = getType(workPackage);
        const normalizedType = type.toUpperCase();

        if (
            normalizedType !== "TASK" &&
            normalizedType !== "SUBTASK"
        ) {
            return [];
        }

        const parentId = getParentId(workPackage);
        const epic = findEpic(workPackage);

        const isLeaf = !parentIds.has(workPackage.id);

        const isExecutionUnit =
            isLeaf &&
            (
                normalizedType === "TASK" ||
                normalizedType === "SUBTASK"
            );

        const task: TaskSnapshot = {
            id: workPackage.id,
            subject: workPackage.subject ?? "",
            storyPoints: workPackage.storyPoints ?? null,
            currentPriority: workPackage._links?.priority?.title ?? null,
            currentAssigneeName: workPackage._links?.assignee?.title ?? null,
            type,
            parentId,
            epicId: epic?.id ?? null,
            epicSubject: epic?.subject ?? null,
            isExecutionUnit,

            ownerAtBaselineId: null,
            currentAssigneeId: getUserId(
                workPackage._links?.assignee?.href,
            ),

            status: getStatus(workPackage),

            // Do not infer acceptance from updatedAt or current status.
            acceptedAt: acceptedDates.get(workPackage.id) ?? null,
            acceptanceEventId: null,
            timeEvidence: acceptedDates.has(workPackage.id) ? "history" : "missing",

            dueDate: workPackage.dueDate ?? null,

            // Baseline values are not inferred from current OpenProject fields.
            baselineDifficulty: null,
            baselineVersion: null,

            contributions: [],
        };

        return [task];
    });
}

function toDefectSnapshots(
    workPackages: OpenProjectWorkPackage[],
): DefectSnapshot[] {
    const byId = new Map(workPackages.map(item => [item.id, item]));
    return workPackages
        .filter(
            (workPackage) =>
                getType(workPackage).toUpperCase() === "BUG",
        )
        .map((workPackage) => ({
            id: workPackage.id,
            subject: workPackage.subject ?? "",
            status: getStatus(workPackage),

            // The team's OpenProject convention is Bug → parent Task/Subtask.
            sourceTaskId: (() => {
                const parentId = getParentId(workPackage);
                const parent = parentId === null ? null : byId.get(parentId);
                return parent && ["TASK", "SUBTASK"].includes(getType(parent).trim().toUpperCase()) ? parent.id : null;
            })(),
            currentAssigneeId: getUserId(workPackage._links?.assignee?.href),
            currentAssigneeName: workPackage._links?.assignee?.title ?? null,

            severity: severityFromPriority(workPackage._links?.priority?.title),
            validatedAt: null,

            // These values require explicit defect-review metadata.
            isDuplicate: false,
            isNotABug: false,
        }));
}

export async function openProjectDashboardDataProvider(projectId: number): Promise<{ dataset: ReportDataset; workItems: WorkPackageListItem[] }> {
        const workPackages = await fetchWorkPackages(projectId);

        const acceptedDates = await fetchAcceptedAt(workPackages);
        const tasks = toTaskSnapshots(workPackages, acceptedDates);
        const defects = toDefectSnapshots(workPackages);

        const now = new Date().toISOString();

        const dataset: ReportDataset = {
            report: {
                projectId,
                from: "1970-01-01T00:00:00.000Z",
                toExclusive: now,
                asOf: now,
                timezone: "Asia/Ho_Chi_Minh",
                ruleVersion: "openproject-v1",
            },
            tasks,
            defects,
        };
        const workItems = toWorkPackageListItems(workPackages);
        const workItemsById = new Map(workItems.map(item => [item.id, item]));
        for (const bug of workItems.filter(item => item.type.trim().toUpperCase() === "BUG")) {
            const sourceTaskId = defects.find(defect => defect.id === bug.id)?.sourceTaskId;
            const sourceTask = sourceTaskId == null ? null : workItemsById.get(sourceTaskId);
            if (sourceTask) {
                bug.parentId = sourceTask.id;
                bug.epicId = sourceTask.epicId;
                bug.epicSubject = sourceTask.epicSubject;
            }
        }
        return { dataset, workItems };
}

export const openProjectReportDatasetProvider: ReportDatasetProvider =
    async (projectId): Promise<ReportDataset> => (await openProjectDashboardDataProvider(projectId)).dataset;

export function registerOpenProjectReportProvider(): void {
    configureReportDatasetProvider(
        openProjectReportDatasetProvider,
    );
}
