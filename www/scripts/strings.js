function isNullOrWhitespace(str) {
    if (str === undefined || str === null) {
        return true;
    }

    return $.trim(String(str)).length === 0;
}