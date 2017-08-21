var moment = require('moment');
var S = require('string');

var re_isNumber = /^\d+$/;
var re_isDate = /^\d{4}-\d{2}-\d{2}[^\s]+?$/;

var helpers = function(ctx) {
  var theme = {
    parseSortValue: function(v) {
      var parsed; // as string
      if (re_isNumber.test(v)) {
        parsed = parseInt(v, 10);
      }
      else if (re_isDate.test(v)) {
        parsed = new Date(v).getTime();
      }
      else {
        parsed = v; // string sort
      }
      return parsed;
    },

    pageToLinkText: function(page) {
      if (!ctx.__usesResolved) {
        return '';
      }
      return page.name ? page.name.toString() : page.title.toString();
    },

    sort: function(collection, key) {
      return collection.sort(function(a, b) {
        var sortA = theme.parseSortValue(a[key]);
        var sortB = theme.parseSortValue(b[key]);
        if (sortA > sortB) {
          return 1;
        }
        else if (sortB < sortA) {
          return -1;
        }
        else {
          return 0;
        }
      });
    },

    slug: function(str) {
      return S(str).slugify().s;
    },

    forEachFiltered: function(collection, key, value, handler) {
      collection.forEach(function(page) {
        if (page && page[key] && page[key].toString() === value) {
          handler.apply(this, arguments);
        }
      });
    },

    // cmawhorter/fancy#14 workaround
    url: function(page, isPrefixed) {
      if (!ctx.__usesResolved) {
        return '';
      }
      var chunk;
      if (page.urlTemplate || page.routes <= 1) {
        chunk = page.url();
      }
      else {
        chunk = page.route[0];
      }
      if (/^[a-z]+\:/.test(chunk)) { // already has proto
        return chunk;
      }
      else {
        return isPrefixed ? theme.prefixUrl(chunk) : chunk;
      }
    },

    prefixUrl: function(url) {
      var prefix;
      switch (process.env.NODE_ENV) {
        case 'production':
          prefix = 'https://www.stam.pr';
        break;
        case 'testing':
          prefix = 'https://testing-www.stam.pr';
        break;
        case 'development':
          prefix = 'http://localhost:8000';
        break;
      }
      return prefix + url;
    },

    author: function(authorPage) {
      if (!ctx.__usesResolved) {
        authorPage = {};
      }
      return {
        firstname: authorPage['author:firstname'] || '',
        lastname: authorPage['author:lastname'] || '',
        fullname: authorPage['author:fullname'] || '',
        title: authorPage['author:title'] || '',
        company: authorPage['author:company'] || '',
        social_label: authorPage['author:social_label'] || '',
        social_url: authorPage['author:social_url'] || '',
        image: authorPage['author:image'] || '',
        url: authorPage.route ? theme.url(authorPage) : '',
      };
    },

    formatDate: function(str, format) {
      var d = moment(str);
      return d.format(format);
    },

    sidebar: function(page) {
      if (page['layout:sidebar']) return page['layout:sidebar'].toString();
      switch (page.resource.toString()) {
        case 'doc':
        case 'doc-outbox':
        case 'doc-passenger':
        case 'doc-autonomy':
        case 'doc-api':
          return 'documentation';
        default:
          return 'company';
      }
    },

    collectionContains: function(collection, page) {
      var pageId = page.id.toString();
      for (var i=0; i < collection.length; i++) {
        var collectionPage = collection[i];
        if (collectionPage.id.toString() === pageId) {
          return true;
        }
      }
      return false;
    },
  };

  return theme;
};

helpers.VERSION = 1;

module.exports = helpers;
