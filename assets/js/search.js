import * as params from '@params';

let fuse; // holds our search engine
let jsonData = {};
let suggestions = [];

// DOM elements
const searchInput = document.getElementById('search-input'); // input field for query search
const suggestionsList = document.getElementById('suggestions-list');
const searchButton = document.getElementById('search-button'); // button to send query
const clearButton = document.getElementById('clear-button'); // button to clear search query and results
const searchResult = document.getElementById('search-results'); // Parent element that will contains all results

window.onload = function () {
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        let data = JSON.parse(xhr.responseText);
        if (data) {
          // fuse.js options; check fuse.js website for details
          let options = {
            distance: 100,
            threshold: 0.4,
            ignoreLocation: true,
            keys: [
                'title',
                'permalink',
                'summary',
                'content'
            ]
          };
          if (params.fuseOpts) {
            options = {
              isCaseSensitive: params.fuseOpts.iscasesensitive ?? false,
              includeScore: params.fuseOpts.includescore ?? false,
              includeMatches: params.fuseOpts.includematches ?? false,
              minMatchCharLength: params.fuseOpts.minmatchcharlength ?? 1,
              shouldSort: params.fuseOpts.shouldsort ?? true,
              findAllMatches: params.fuseOpts.findallmatches ?? false,
              keys: params.fuseOpts.keys ?? ['title', 'permalink', 'summary', 'content'],
              location: params.fuseOpts.location ?? 0,
              threshold: params.fuseOpts.threshold ?? 0.4,
              distance: params.fuseOpts.distance ?? 100,
              ignoreLocation: params.fuseOpts.ignorelocation ?? true
            }
          }
          fuse = new Fuse(data, options); // build the index from the json file
          jsonData = data;
          suggestions = [...new Set(
            jsonData.flatMap(d => [...(d.tags || []), ...(d.keywords || [])])
          )];
        }
      } else {
        console.log(xhr.responseText);
      }
    }
  };
  xhr.open('GET', '/index.json'); // JSON where to find data
  xhr.send();
}

// Event listener for sending query when RETURN is pressed
searchInput.onkeyup = function (event) {
  if (event.key === 'Enter') {
    executeSearch();
  }
};

// Event listener for sending query when searchButton is pressed
searchButton.onclick = function (event) {
  if (event.button === 0) {
    executeSearch();
  }
};

// Function that executes the query (from field searchInput)
function executeSearch() {
  if (!fuse) { return; }

  let results;
  if (params.fuseOpts) {
    results = fuse.search(searchInput.value.trim(), {limit: params.fuseOpts.limit}); // the actual query being run using fuse.js along with options
  } else {
    results = fuse.search(searchInput.value.trim()); // the actual query being run using fuse.js
  }

  // Show results
  if (results.length > 0) {
    const createListItem = (html) => `<li>${html}</li>`;

    const createLink = ({ permalink, title }) => `
      <a href="${permalink}" tabindex="0">
        <span class="title">${title}</span>
      </a>
    `;

    searchResult.innerHTML = results
      .map(({ item }) => createListItem(createLink(item)))
      .join('');
  } else {
    searchResult.innerHTML = '';
  }
}

// Event listener for clearing query and results when clearButton is pressed
clearButton.onclick = function (event) {
  if (event.button === 0) {
    // clear search
    searchInput.value = ''; // delete searchInput field
    searchResult.innerHTML = ''; // hide results
  }
};

// Provide suggestions based on user input
searchInput.oninput = function () {
  const value = this.value.trim().toLowerCase();
  suggestionsList.innerHTML = '';
  if (!value) {
    suggestionsList.style.display = 'none';
    return;
  }
  const matches = suggestions.filter(tag => tag.toLowerCase().includes(value));
  if (matches.length === 0) {
    suggestionsList.style.display = 'none';
    return;
  }
  matches.forEach(match => {
    const li = document.createElement('li');
    li.textContent = match;
    li.onclick = () => {
      searchInput.value = match;
      suggestionsList.style.display = 'none';
      searchInput.focus();
    };
    suggestionsList.appendChild(li);
  });
  suggestionsList.style.display = 'block';
};

// move through suggestions
searchInput.onkeydown = function (event) {
  if (event.key === 'ArrowDown') {
    console.log('down');
  } else if (event.key === 'ArrowUp') {
    console.log('up');
  }
}

// Hide suggestions when clicking outside
document.onclick = function (event) {
  if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
    suggestionsList.style.display = 'none';
  }
};
