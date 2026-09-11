
export interface StudentStatus {
    dbId?: number; // Internal DB ID (numeric) for API calls
    studentId?: string; // The real DB ID Code (e.g. S001) for updates
    isNewStudent?: boolean; // true if unregistered in DB or registered within 2 weeks
    isChurnRisk?: boolean; // true if student is flagged as churn risk
    churnRiskReason?: string | null; // reason for churn risk flag
    hasUnreadLine: boolean;
    hasSharedNote: boolean;
    hasEvents?: boolean;
    hasTestSchedules?: boolean;
    hasCollectionTask?: boolean;
    sharedNoteContent: string | null;
    schoolId?: number | null;
    schoolName?: string | null;
    events?: {
        id: number;
        title: string;
        date: string;
        type: string;
        description?: string;
        endDate?: string;
        resolvedAt?: string | null;
        notifyStart?: string;
        notifyEnd?: string;
    }[];
    announcements?: {
        id: number;
        title: string;
        detail: string;
        importance: 'HIGH' | 'MEDIUM' | 'LOW';
        date: string; // Created date or notify start
        notifyStart?: string;
        notifyEnd?: string;
        resolvedAt?: string | null;
    }[];
    testSchedules?: {
        id: string;
        name: string;
        schoolId: number;
        schoolName: string;
        start: string;
        end: string;
        collectGrades: string[];
    }[];
    allSchoolTestSchedules?: {
        id: string;
        name: string;
        schoolId: number;
        schoolName: string;
        start: string;
        end: string;
        collectGrades: string[];
    }[];
}

export interface ApiResponse<T> {
    success: boolean;
    status?: number;
    data?: T;
    error?: string;
}

const DEFAULT_API_URL = 'https://eisai-api.vercel.app';

export async function getAppUrl(): Promise<string> {
    return new Promise((resolve) => {
        chrome.storage.local.get(['jukmane_api_url'], (items) => {
            let url = items.jukmane_api_url || DEFAULT_API_URL;
            if (url.endsWith('/')) url = url.slice(0, -1);
            resolve(url);
        });
    });
}

async function getBaseUrl(): Promise<string> {
    const appUrl = await getAppUrl();
    return `${appUrl}/api`;
}

/**
 * Sends a message to the background script to fetch data from the API.
 */
async function fetchFromBackground<T>(path: string, options: RequestInit = {}): Promise<T | null> {
    const baseUrl = await getBaseUrl();

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: 'FETCH_API',
                payload: {
                    url: `${baseUrl}${path}`,
                    options,
                },
            },
            (response: ApiResponse<T>) => {
                if (chrome.runtime.lastError) {
                    console.error('Runtime Error:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (!response || !response.success) {
                    console.warn(`API Error [${path}] Status: ${response?.status} URL: ${baseUrl}`, response?.error);
                    resolve(null);
                    return;
                }
                resolve(response.data || null);
            }
        );
    });
}

export const api = {
    /**
     * Get the configured base URL for debugging purposes
     */
    getConfiguredUrl: async (): Promise<string> => {
        return new Promise((resolve) => {
            chrome.storage.local.get(['jukmane_api_url'], (items) => {
                resolve(items.jukmane_api_url || 'Not Set (Defaulting to localhost)');
            });
        });
    },

    /**
     * Fetch status for students by IDs or Names
     */
    getStudentStatus: async ({ studentIds, studentNames }: { studentIds?: string[], studentNames?: string[] }): Promise<Record<string, StudentStatus> & { _campus?: { id: number, name: string } }> => {
        const params = new URLSearchParams();
        if (studentIds && studentIds.length > 0) params.append('studentIds', studentIds.join(','));
        if (studentNames && studentNames.length > 0) params.append('studentNames', studentNames.join(','));

        const queryString = params.toString();
        if (!queryString) return {};

        const data = await fetchFromBackground<Record<string, StudentStatus> & { _campus?: { id: number, name: string } }>(`/extension/status?${queryString}`);
        return data || {};
    },

    /**
     * Update shared note for a student
     */
    updateStudentNote: async (studentId: string, content: string): Promise<boolean> => {
        const response = await fetchFromBackground<{ success: boolean }>(`/extension/note`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, content })
        });
        return response?.success || false;
    },

    /**
     * Create a new event for a student (Rich)
     */
    createEvent: async (event: {
        studentId?: string;
        title: string;
        date: string;
        endDate?: string;
        type: 'EXAM' | 'EIKEN' | 'SEASONAL_COURSE' | 'OTHER';
        description?: string;
        notifyStart?: string;
        notifyEnd?: string;
    }): Promise<any> => {
        const response = await fetchFromBackground<any>(`/extension/event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });
        return response || null;
    },

    /**
     * Create a new announcement (Shared Matter) for a student
     */
    createAnnouncement: async (announcement: {
        studentId?: string;
        title: string;
        detail: string;
        importance: 'HIGH' | 'MEDIUM' | 'LOW';
        notifyStart?: string;
        notifyEnd?: string;
    }): Promise<any> => {
        const response = await fetchFromBackground<any>(`/extension/announcement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(announcement),
        });
        return response || null;
    },

    /**
     * Update an announcement
     */
    updateAnnouncement: async (announcement: {
        id: number;
        title: string;
        detail: string;
        importance: 'HIGH' | 'MEDIUM' | 'LOW';
        notifyStart?: string;
        notifyEnd?: string;
    }): Promise<any> => {
        const response = await fetchFromBackground<any>(`/extension/announcement`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(announcement),
        });
        return response || null;
    },

    /**
     * Delete an announcement
     */
    deleteAnnouncement: async (id: number): Promise<boolean> => {
        const response = await fetchFromBackground<{ success: boolean }>(`/extension/announcement?id=${id}`, {
            method: 'DELETE'
        });
        return response?.success || false;
    },

    /**
     * Update an event
     */
    updateEvent: async (event: {
        id: number;
        title: string;
        date: string;
        endDate?: string;
        type: 'EXAM' | 'EIKEN' | 'SEASONAL_COURSE' | 'OTHER';
        description?: string;
        notifyStart?: string;
        notifyEnd?: string;
    }): Promise<any> => {
        const response = await fetchFromBackground<any>(`/extension/event`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });
        return response || null;
    },

    /**
     * Delete an event
     */
    deleteEvent: async (id: number): Promise<boolean> => {
        const response = await fetchFromBackground<{ success: boolean }>(`/extension/event?id=${id}`, {
            method: 'DELETE'
        });
        return response?.success || false;
    },

    /**
     * Toggle resolved status of an event
     */
    toggleResolvedEvent: async (id: number, resolved: boolean): Promise<boolean> => {
        const response = await fetchFromBackground<any>(`/events/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolved })
        });
        return !!response;
    },

    /**
     * Toggle resolved status of an announcement
     */
    toggleResolvedAnnouncement: async (id: number, resolved: boolean): Promise<boolean> => {
        const response = await fetchFromBackground<any>(`/announcements/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolved })
        });
        return !!response;
    },

    /**
     * Add a test schedule to a school
     */
    addTestSchedule: async (schoolId: number, test: {
        name: string;
        start: string;
        end: string;
        collectGrades?: string[];
    }): Promise<any> => {
        const response = await fetchFromBackground<any>(`/extension/test-schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schoolId, ...test }),
        });
        return response || null;
    },

    /**
     * Delete a test schedule from a school
     */
    deleteTestSchedule: async (schoolId: number, testName: string): Promise<boolean> => {
        const response = await fetchFromBackground<{ success: boolean }>(`/extension/test-schedule?schoolId=${schoolId}&name=${encodeURIComponent(testName)}`, {
            method: 'DELETE'
        });
        return response?.success || false;
    },

    /**
     * Get campus-wide overview (global announcements, events, registered names, test schedules)
     */
    getCampusOverview: async (): Promise<any> => {
        const response = await fetchFromBackground<any>(`/extension/campus-overview`, {
            method: 'GET'
        });
        return response || null;
    },

    /**
     * Update churn risk status for a student
     */
    updateChurnRisk: async (dbId: number, isChurnRisk: boolean, churnRiskReason?: string): Promise<boolean> => {
        const response = await fetchFromBackground<any>(`/students/${dbId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isChurnRisk, churnRiskReason: churnRiskReason || null })
        });
        return !!response;
    },

    /**
     * Get seat configuration and lecturer preferences for the campus
     */
    getSeatConfig: async (): Promise<{
        seatConfig: { availableSeats: number[]; defaultOrder: number[] };
        lecturers: { id: number; name: string; fabocKoushiId: string | null; seatPreferences: number[] }[];
    } | null> => {
        const response = await fetchFromBackground<any>(`/extension/seat-config`, {
            method: 'GET'
        });
        return response || null;
    },

    /**
     * Sync lecturer list from faboc DOM to the database
     */
    syncLecturers: async (lecturers: { fabocKoushiId: string; name: string }[]): Promise<boolean> => {
        const response = await fetchFromBackground<{ success: boolean }>(`/extension/sync-lecturers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lecturers })
        });
        return response?.success || false;
    },

    /**
     * Update a lecturer's seat preferences
     */
    updateLecturerSeatPreference: async (lecturerId: number, seatPreferences: number[]): Promise<boolean> => {
        const response = await fetchFromBackground<{ success: boolean }>(`/extension/seat-config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lecturerId, seatPreferences })
        });
        return response?.success || false;
    },

    /**
     * Delete a lecturer from the database
     */
    removeLecturerPreference: async (lecturerId: number): Promise<boolean> => {
        const response = await fetchFromBackground<{ success: boolean }>(`/extension/seat-config?lecturerId=${lecturerId}`, {
            method: 'DELETE'
        });
        return response?.success || false;
    },

    /**
     * Update the default seat order for the campus
     */
    updateDefaultOrder: async (defaultOrder: number[]): Promise<boolean> => {
        const response = await fetchFromBackground<{ success: boolean }>(`/extension/seat-config`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ defaultOrder })
        });
        return response?.success || false;
    }
};
