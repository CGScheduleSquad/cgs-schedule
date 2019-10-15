export function capitalize(s: string) {
    return s.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}