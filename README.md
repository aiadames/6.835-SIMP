# 6.835-SIMP
Final code for 6.835 project Spotify Integrated Multimodal Program (SIMP)
## 6.835 Final Project: Spotify Integrated Multimodal Program (SIMP)
#### Group Members: Ariana Adames & Derek Velez 

Set Up Instructions:

#### Table of contents

1. Setup & Dependencies
2. File Specification


## Setup & Dependencies
Requirements: Node.js V 14.0.0 or higher, Spotify Premium (to control user playback functions provided by API)\
Packages: tbd

<b> Set Up Instructions: </b>

Download & in directory run following commands for dependencies:
  'npm install spotify-web-api-node --save' 
  'npm install express'
  'npm install --global http-server'
Then navigate to Spotify Developer: developer.spotify.com/dashboard to create a new project on your Spotify account
Edit project on Spotify Developer dashboard once created to have 'Redirect URI' of http://localhost:8888/callback
  - copy 'Client ID' and 'Client Secret' and paste in simp_tester.js values <b>clientId</b> and <b>clientSecret</b>
  - run in terminal 'node simp_tester' and follow instructions to authenticate and get access token
  - copy and paste access token (not refresh token) value into main.js for const <b>token</b>
Run in terminal 'browserify main.js -o bundle.js' to compile changes

Open Spotify Player + run 'http-server' to begin running program on local server and view UI panel

Note: Every hour, the Spotify token expires, thus must run 'node simp_tester' to aquire new token if expired. Then copy/paste into main.js and recompile to run again.


## File Specification
