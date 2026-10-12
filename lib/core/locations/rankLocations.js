export function rankLocations(locations, query) {
    const normalizedQuery = query.trim().toLowerCase();

    return [...locations].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();

        const aExact = aName === normalizedQuery;
        const bExact = bName === normalizedQuery;

        if (aExact !== bExact) {
            return Number(bExact) - Number(aExact);
        }

        const aStartsWith = aName.startsWith(normalizedQuery);
        const bStartsWith = bName.startsWith(normalizedQuery);

        if (aStartsWith !== bStartsWith) {
            return Number(bStartsWith) - Number(aStartsWith);
        }

        return (b.population ?? 0) - (a.population ?? 0);
    });
}