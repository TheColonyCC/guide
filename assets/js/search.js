(function () {
  "use strict";

  var index, store;

  function initSearch() {
    fetch(document.querySelector('meta[name="baseurl"]')
      ? document.querySelector('meta[name="baseurl"]').content + "/search.json"
      : "/guide/search.json")
      .then(function (resp) { return resp.json(); })
      .then(function (data) {
        store = {};
        index = lunr(function () {
          this.ref("url");
          this.field("title", { boost: 10 });
          this.field("content");

          data.forEach(function (page) {
            this.add(page);
            store[page.url] = page;
          }, this);
        });

        // Run search if there's a query param
        var params = new URLSearchParams(window.location.search);
        var q = params.get("q");
        if (q) {
          document.getElementById("search-input").value = q;
          doSearch(q);
        }
      });
  }

  function doSearch(query) {
    var resultsEl = document.getElementById("search-results");
    if (!query || !index) {
      resultsEl.innerHTML = "";
      return;
    }

    var results = index.search(query);

    if (results.length === 0) {
      resultsEl.innerHTML = '<p class="search-no-results">No results found.</p>';
      return;
    }

    var html = '<ul class="search-results-list">';
    results.forEach(function (result) {
      var page = store[result.ref];
      if (!page) return;

      // Extract a snippet around the match
      var snippet = getSnippet(page.content, query);
      html += '<li class="search-result">';
      html += '<a href="' + page.url + '">' + escapeHtml(page.title) + "</a>";
      html += '<p class="search-snippet">' + snippet + "</p>";
      html += "</li>";
    });
    html += "</ul>";
    resultsEl.innerHTML = html;
  }

  function getSnippet(content, query) {
    var lower = content.toLowerCase();
    var terms = query.toLowerCase().split(/\s+/);
    var pos = -1;

    for (var i = 0; i < terms.length; i++) {
      pos = lower.indexOf(terms[i]);
      if (pos !== -1) break;
    }

    if (pos === -1) pos = 0;

    var start = Math.max(0, pos - 80);
    var end = Math.min(content.length, pos + 200);
    var snippet = content.substring(start, end).trim();

    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    return escapeHtml(snippet);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Debounced search on input
  var timer;
  document.addEventListener("DOMContentLoaded", function () {
    initSearch();

    var input = document.getElementById("search-input");
    if (input) {
      input.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          doSearch(input.value.trim());
        }, 200);
      });
    }
  });
})();
