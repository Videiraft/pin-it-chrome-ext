import { appHtml } from './viewApp.js';
import { loginHtml } from './viewLogin.js';

// TODO: Green color for successful entries before closing the window
// TODO: Red color for every error
// TODO: Link to the app to create a new User
// TODO: Permanent Link to the app
// TODO: Autocomplete for more than one tag, comma separated

const basicUrl = 'http://127.0.0.1:4000';

init();

function init () {
  // check if user is loged in
  chrome.storage.local.get(['authToken'], function(items) {
    const token = items.authToken
    // render html according to the need of login in or not
    document.body.innerHTML = token ? appHtml : loginHtml;  
    // if the user is loged in show app page
    if (token) {
      appPage(token);
      // If the user is not logged show Login page
    } else {
      loginPage();
    }
  });
}

//
// App page
//
function appPage (token) {
  let title = '';
  let description = '';
  let tabURL = '';
  let favicon = '';
  const url = basicUrl + '/users/links/tags';
  
  document.getElementById('app-form').addEventListener('submit', handleNewLink);
  document.getElementById('log-out').addEventListener('click', handleLogOut);
  document.querySelector('[name="tags"]').focus();
  document.getElementById('logo').src = chrome.runtime.getURL('./assets/pin-it.png');

  // Fetch tags on server and get tags to autocomplete
  fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
    },
  })
    .then(response => response.json())
    .then(({ status, data }) => {
      // TODO: if (status === 'fail')
      for (let i = 0; i < data.tags.length; i++) {
        document.getElementById('tags').insertAdjacentHTML(
          'beforeend',
          `<option value=${data.tags[i]}>`,
        );
      }
    })
    .catch(err => console.log(err));

  // Get link information (tab)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    tabURL = tabs[0].url;
    title = tabs[0].title;
    favicon = tabs[0].favIconUrl;
    const titleHtml = `<h1>${title}</h1>`;
    document.querySelector('.title-container').insertAdjacentHTML('afterbegin', titleHtml);
    chrome.tabs.getSelected(null, function(tab){
      chrome.tabs.executeScript(tab.id, {file: "./getDescription.js"}, function(response) {
        description = response[0];
      });
    });
  });
  
  // Submit link function
  function handleNewLink (e) {
    e.preventDefault();
    const url = basicUrl + '/users/links';
    const tagsStr = document.querySelector('[name="tags"]').value.replace(/\s/g,'');
    const tags = tagsStr.split(',');
    const data = { title, url: tabURL, tags, favicon, description };
    fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(({ status }) => {
        if (status === 'fail') {
          document.getElementById('message-feedback').innerText = '';
          document.getElementById('message-feedback').insertAdjacentText('afterbegin', 'This link already exists.');
        } else {
          document.getElementById('message-feedback').innerText = '';
          document.getElementById('message-feedback').insertAdjacentText('afterbegin', 'Link was successfully saved!');
          setTimeout(() => {
            window.close();
          }, 1000)
        }
      })
      .catch(err => {
        // Fetch was not possible. Show a message
        document.getElementById('message-feedback').innerText = '';
        document.getElementById('message-feedback').insertAdjacentText('afterbegin', 'Something went wrong. Please, try again later.');
      });
  }

  function handleLogOut (e) {
    chrome.storage.local.clear( () => {
      console.log('clear local storage.');
      init();
    });
  }
}

//
// Login page
//
function loginPage () {
  const url = basicUrl + '/users/login';
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logo').src = chrome.runtime.getURL('./assets/pin-it.png');

  function handleLogin (e) {
    e.preventDefault();
    const username = document.querySelector('[name="email"]').value.trim();
    const password = document.querySelector('[name="password"]').value.trim();

    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + window.btoa(username + ":" + password),
      },
    })
      .then(response => response.json())
      .then(({ status, data }) => {
        if (status === 'fail') {
          document.getElementById('message-feedback').insertAdjacentText('afterbegin', 'Email or password are incorrect.');
        } else {
          chrome.storage.local.set({ authToken: data.id_token }, () => {
            location.reload();
          });
        }
      })
      .catch(err => {
        // Fetch was not possible. Show a message
        document.getElementById('message-feedback').insertAdjacentText('afterbegin', 'Something went wrong. Please, try again later.');
      });
  }
}
