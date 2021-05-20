# simp
this is simp.

download & in directory run 'npm install spotify-web-api-node --save'
'npm install express'

to run: go to spotify developer developer.spotify.com/dashboard and copy client id and secret into simp_tester
        and make sure you copy callback uri to be same as in file by clicking 'edit details' on dashboard
       
then run 'node simp_tester' to get access token
copy and paste that from terrminal into getMe.js for const token = '' 
run 'node getMe' to pause player or other stuff
