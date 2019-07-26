import { appHtml } from './viewApp.js';
import { loginHtml } from './viewLogin.js';

const basicUrl = 'http://127.0.0.1:4000';

// check if user is loged in
chrome.storage.local.get(['authToken'], function(items) {
  const token = items.authToken
  // render html according to the need of login in or not
  document.body.innerHTML = token ? appHtml : loginHtml;

  // TODO: What if the token is not valid anymore? 
  // TODO: How to check it and how to redirect to the correct page?

  // TODO: LogOut button
  // TODO: warnings - "Link already exists"; "Wrong Password or Email";
  // TODO: Link to the app to create a new User
  // TODO: Permanent Link to the app

  // if the user is loged in
  if (token) {
    //
    // App page
    //
    let title = '';
    let tabURL = '';
    document.getElementById('app-form').addEventListener('submit', handleNewLink);

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      tabURL = tabs[0].url;
      title = tabs[0].title;
      const titleHtml = `<h1>${title}</h1>`;
      document.querySelector('.title-container').insertAdjacentHTML('afterbegin', titleHtml);
    });
    
    function handleNewLink (e) {
      e.preventDefault();
      const url = basicUrl + '/users/links';
      const tagsStr = document.querySelector('[name="tags"]').value.replace(/\s/g,'');
      const tags = tagsStr.split(',');
    
      const data = { title, url: tabURL, tags };
      fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(data),
      })
        .then(response => response.json())
        .then(data => console.log(data));
    }
  } else {
    //
    // Login page
    //
    const url = basicUrl + '/users/login';
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    function handleLogin (e) {
      e.preventDefault();
      console.log('trying!');
      const username = document.querySelector('[name="email"]').value.trim();
      const password = document.querySelector('[name="password"]').value.trim();
  
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + window.btoa(username + ":" + password),
        },
      })
        .then(response => response.json())
        .then(data => {
          console.log('trying!');
          chrome.storage.local.set({ authToken: data.id_token }, function(){
            console.log('Success seting data: ', data.id_token);
          });
        });
    }
  }
});
