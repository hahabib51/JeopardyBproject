const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;


//Create a function so that categories can be chosen at random as well as making sure the same ones do not show up twice. 

function getSample(array, n) {
    // Verify that the array elements do not exceed the random elements or it’ll cause an infinite loop. 
    if(n > array.length) {
        return null;
    }

    const output = [];

    // Create a while loop condition for the output array so that it is not equal to the number of elements needed. 
    while (output.length !== n) {
        // Calculate random index for the loop to get random items in the provided array.
        let n = Math.floor( Math.random() * array.length );
        // Check if the random item is not already in the output array to avoid duplicates and if so, then push it to output array.
        // If the item is already in the output array, then it will not push anything and will continue to loop
        if(output.indexOf(array[n]) === -1) {
            output.push(array[n]);
        }
    }
    return output
}

// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];


/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */


async function getCategoryIds() {
    // GET the data from the api using axios
    let response = await axios.get('https://jservice.io/api/categories?count=100');
    // return ids array for all the categories
    console.log(response);
    let categoryIds = response.data.map(cat => cat.id);
    // select random 6 categories
    let randomCategories = getSample(categoryIds, NUM_CATEGORIES);
    return randomCategories;
}


/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    // GET the data about the category from the api using axios
    let response = await axios.get('https://jservice.io/api/category?id='+catId);
    // store the title
    let title = response.data.title;
    // Get 5 random clues from the response clues
    let clues = getSample(response.data.clues, NUM_QUESTIONS_PER_CAT);
    // Map through clues array to return the required data structure
    let clueArray = clues.map(function(clue) {

        return {
          question: clue.question, 
          answer: clue.answer, 
          showing: null}
    });

    return { 
      title: title, 
      clues: clueArray}
}


/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */ 
// 

async function fillTable() {
    let tableHeader = '<thead><tr>';
    for (let i = 0; i < NUM_CATEGORIES; i++){
        tableHeader += '<td>' + categories[i].title + '</td>';
    }
    tableHeader += '</tr></thead>';
    $('table#jeopardy').append(tableHeader);

    let tableContent = '<tbody>';
    // Create NUM_QUESTIONS_PER_CAT(5) <tr>
    for (let i = 0; i < NUM_QUESTIONS_PER_CAT; i++){
        tableContent += '<tr>';
        // Create NUM_CATEGORIES(6) <td> to fill each row
        for(let x = 0; x < NUM_CATEGORIES; x++){
            tableContent += '<td id="'+ x + '-' + i +'">?</td>';
        }
        tableContent += '</tr>';
    }
    tableContent += '</tbody>';
    $('table#jeopardy').append(tableContent);
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    // id will be like "0-2" or "1-2"
    // First number represents Category Index in categories array
    // Second number represents Clue Index in clues array inside that category
    let id = evt.target.id;
    // splittedID example ["0","2"] or ["1","2"]
    let splittedID = id.split('-');
    // parseInt to return it as a number not a string
    let categoryIndex = parseInt( splittedID[0] );
    let clueIndex = parseInt( splittedID[1] );

    let currentClue = categories[categoryIndex].clues[clueIndex];
    // state can be null or question or answer
    let state = currentClue.showing;
    
    if(state === null){
        // retreive the question
        let question = currentClue.question;
        // Put it inside the correct <td>
        $('#'+categoryIndex+'-'+clueIndex).text(question);
        // Change the .showing to 'question'
        currentClue.showing = 'question';
    } else if (state === 'question') {
        let answer = currentClue.answer;
        $('#'+categoryIndex+'-'+clueIndex).html(answer);
        currentClue.showing = 'answer';
        // Just a class for styling the answer and give it green background
        $('#'+categoryIndex+'-'+clueIndex).addClass('answer');
    } else if (state === 'answer'){
        // ignore click
        evt.preventDefault();
        return false
    }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    $('#jeopardy').empty();
    
    // Pure CSS loader used from https://loading.io/css/
    let loader = 
    '<div id="loader"><div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>';
    
    // Put the loader before the table
    $('#jeopardy').before(loader);

    // update the button
    $('#start').text('Loading ...');

}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    $('#loader').remove();
    $('#start').text('Restart!');
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    // Initialize categories because when clicking restart it will have data already so we need to clear the data
    categories = [];
    let ids = await getCategoryIds();

    for(let i = 0; i < ids.length; i++){
        let categoryData = await getCategory(ids[i]);
        categories.push(categoryData);
    }
    
    fillTable();
    hideLoadingView();
}

/** On click of start / restart button, set up game. */

// TODO

$('#start').click(function() {
    showLoadingView();
    setupAndStart();
});

/** On page load, add event handler for clicking clues */

// TODO
$(document).ready(function() {
    $(document).on('click', 'tbody tr td', handleClick);
});