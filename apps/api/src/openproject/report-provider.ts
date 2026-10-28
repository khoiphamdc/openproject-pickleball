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
    subject?: string;
    storyPoints?: number | null;
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
            signal: AbortSignal.timeout(15_000),
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

function toTaskSnapshots(
    workPackages: OpenProjectWorkPackage[],
): TaskSnapshot[] {
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
            isExecutionUnit,

            ownerAtBaselineId: null,
            currentAssigneeId: getUserId(
                workPackage._links?.assignee?.href,
            ),

            status: getStatus(workPackage),

            // Do not infer acceptance from updatedAt or current status.
            acceptedAt: null,
            acceptanceEventId: null,
            timeEvidence: "missing",

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
    return workPackages
        .filter(
            (workPackage) =>
                getType(workPackage).toUpperCase() === "BUG",
        )
        .map((workPackage) => ({
            id: workPackage.id,
            subject: workPackage.subject ?? "",
            status: getStatus(workPackage),

            // A source-task relationship must be explicitly mapped.
            // Do not assume that the bug's parent is its source task.
            sourceTaskId: null,

            severity: "Medium",
            validatedAt: null,

            // These values require explicit defect-review metadata.
            isDuplicate: false,
            isNotABug: false,
        }));
}

export const openProjectReportDatasetProvider: ReportDatasetProvider =
    async (projectId): Promise<ReportDataset> => {
        const workPackages = await fetchWorkPackages(projectId);

        const tasks = toTaskSnapshots(workPackages);
        const defects = toDefectSnapshots(workPackages);

        const now = new Date().toISOString();

        return {
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
    };

export function registerOpenProjectReportProvider(): void {
    configureReportDatasetProvider(
        openProjectReportDatasetProvider,
    );
}
