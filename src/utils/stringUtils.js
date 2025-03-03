/**
 * @param {string} entireCode
 * @param {string} substring
 */
function findMatches(entireCode, substring) {
    if( substring.startsWith(" ")) {
        substring = substring.trimStart();
    }
    
    if(!entireCode.includes(substring.split("")[0])) {
        console.log(`codice NON contiene ${substring.split("")[0]}   `);
        return;
    }

}

module.exports = {
    findMatches
}
