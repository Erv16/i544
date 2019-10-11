/**
 * Question 1
 * Using a filter to return an array that contains the lists whose lengths 
 * are a multiple of the value passed using the modulus operator.
 */

function selectListsWithLengthMultiple(arr,multiple){
	return JSON.stringify(arr.filter(elem => elem.length % multiple === 0));
}


/**
 * Question 2
 * Reference url: https://stackoverflow.com/questions/45865983/i-want-to-reverse-a-string-in-javascript-without-using-inbuilt-functions
 * Using the split, convert the string to an array and then use reduce over the 
 * array to return the reverse of the original string by iterating over its elements and appending them
 */

function reverse(str){
	return str.split('').reduce((rev, char) => char + rev, '');
}

/** 
 * Question 3
 * Returns a boolean value using the ternary operator depending on if the reverse value of the string 
 * matches the original value of the string.
 */

function isPalindrome(str){
	return (str.replace(/\W+/g,'') === (str.replace(/\W+/g,'').split('').reduce((rev, char) => char + rev, '')) ? true : false);
}

/**
 * Question 4
 * It spreads the lists and compares their lengths using the sort method and returns the list with 
 * the shortest length.
 */

function minLenArg(...param){
	return param.sort((a,b) => (a.length >= b.length) ? 1 : -1).slice(0,1);
}

/**
 * Question 5
 * Reference url: https://stackoverflow.com/questions/9939760/how-do-i-convert-an-integer-to-binary-in-javascript
 * The method first converts the original string to the corresponding base value provided. It then splits 
 * the string into an array, reverses it and then starts adding the separator at every nth index.
 */

function formatInt(int, {base=10, n=3, sep=','} = {base: 10, n:3, sep: ','}){
	return int.toString(base).split('').reverse()
	.reduceRight((acc,elem,index) => acc + elem + (index % n === 0 ? sep : ''),'').slice(0,-1);
}


/**
 * Question 6 
 * Reference url: https://stackoverflow.com/questions/9939760/how-do-i-convert-an-integer-to-binary-in-javascript
 * Converts the input to binary and counts the total number of 1’s and returns a boolean value depending 
 * on whether the count of 1’s is even or not.
 */

function isEvenParity(num){
	return ((num.toString(2).split('1').length-1) % 2 === 0);
}

/**
 * Question 7
 * The value of 2 raised to the indexes that are provided signify the bits that have been set 
 * and on accumulating that value the corresponding integer value is generated.
 */

function bitIndexesToInt(arr){
	return arr.reduce((acc,val) => acc + 2 ** val,0);
}

/**
 * Question 8
 * The integer value is converted to an array containing its binary representation. 
 * Iterating across the array it filters all the bits that have been set and returns the result. 
 */

function intToBitIndexes(num){
	return num.toString(2).split('')
	.reduce((rev, char) => char + rev, '')
	.split('')
	.map((e, i) => e === '1' ? i : '')
    .filter(elem => elem !== '');
}

/**
 * Question 9
 * Setting the object as the default value in the reduce. Split the index argument based on the ‘.’ 
 * and then iterate through each element to access the properties within the provided object.
 */

function multiIndex(obj, index){
	return (index.length === 0 ? obj : index.split('.').reduce((acc,elem) => acc[elem],obj));
}

/**
 * Question 10
 * Reference url: https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
 * It iterates through the arrays and returns array containing elements present at the same index from both the arrays
 */

function zip(arr1, arr2) {
	return arr1.map((e,i) =>
		[e,arr2[i]]
	)  	
}

/**
 * Question 11
 * Reference url: https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
 * The outer most map is used to decide the length of the result while the inner map is used to return arrays that 
 * contain elements whose index is the same across all the provided input arrays.
 */

function multiZip(...lists) {
    return lists[0].map(function(_,i){ //Doesn't really care about the value, just using it for the index to iterate
        return lists.map(function(list){return list[i]})
    });
}

/**
 * Question 12
 * Reference url: https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
 * The method first identifies the array that has the smallest length and uses that length to decide the length of the result. 
 * The map is used for generating arrays that contain elements whose index is the same across all the provided input arrays
 */

function multiZipAny(...lists){ 
	return lists.reduce((acc,val) => acc.length < val.length ? acc : val)
	.map(function(_,index){
        return lists.map(function(array){return array[index]})
    });
}
