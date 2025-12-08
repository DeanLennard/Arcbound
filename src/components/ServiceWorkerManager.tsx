"use client";

import { useEffect } from "react";

export default function ServiceWorkerManager() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        // Step 1: Unregister old service workers
        navigator.serviceWorker.getRegistrations().then((regs) => {
            regs.forEach((r) => r.unregister());
        });

        // Step 2: Register your push-only service worker fresh
        navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, []);

    return null;
}
