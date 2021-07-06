// array
function removeElementTemplate(key = (e) => e) {
    return (arr, val) => {
        for (let i = 0; i < arr.length; ++i) {
            if (key(arr[i]) == val) {
                arr.splice(i, 1);
                break;
            }
        }
    }
}

module.exports = {removeElementTemplate};