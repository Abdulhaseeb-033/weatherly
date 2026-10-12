export function formatLocationLabel(location) {
    const parts = [
        location.name,
        location.region,
        location.country,
    ];

    return parts
        .filter(Boolean)
        .filter((part, index, array) => array.indexOf(part) === index)
        .join(", ");
}