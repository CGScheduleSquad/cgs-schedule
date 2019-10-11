export function getClassAsArray(cl: string): Array<any> {
    return Array.from(document.getElementsByClassName(cl));
}