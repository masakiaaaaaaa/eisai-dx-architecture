"use client";

import { useState, useEffect } from 'react';

type CampusData = {
    id: number;
    name: string;
};

export function useCampus() {
    const [campus, setCampusData] = useState<CampusData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchCampusData = async () => {
            const storedId = localStorage.getItem('campusId');
            let storedName = localStorage.getItem('campusName');

            if (storedId) {
                const id = parseInt(storedId);
                
                // Fetch name dynamically if missing or empty
                if (!storedName || storedName === 'undefined') {
                    try {
                        const res = await fetch('/api/campuses');
                        if (res.ok) {
                            const campuses = await res.json();
                            const found = campuses.find((c: any) => c.id === id);
                            if (found) {
                                storedName = found.name;
                                localStorage.setItem('campusName', found.name);
                            }
                        }
                    } catch (e) {
                        console.error('Failed to fetch campus name fallback');
                    }
                }

                if (isMounted) {
                    setCampusData({
                        id,
                        name: storedName || `校舎 ID: ${id}`,
                    });
                }
            }
            if (isMounted) {
                setIsLoading(false);
            }
        };

        fetchCampusData();
        return () => { isMounted = false; };
    }, []);

    const setCampus = (id: number, name: string) => {
        localStorage.setItem('campusId', id.toString());
        localStorage.setItem('campusName', name);
        setCampusData({ id, name });
    };

    const clearCampus = () => {
        localStorage.removeItem('campusId');
        localStorage.removeItem('campusName');
        setCampusData(null);
    };

    return {
        campus,
        isLoading,
        setCampus,
        clearCampus
    };
}
