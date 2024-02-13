import os;

#projectFolders=["."]
# projectFolders=["backOffice"]
projectFolders=["www"]

def onedir(dirname): 
    blacklist = ['.vs', '.vscode', '.idea', '.git', 'dist', 'plugins', 'installationGuide',
                 'wwwKs','TBD',
                 'node_modules', 'lib', 'lib-debug-duplicated', 'lib-debug', 'libDefer'];
    blacklistFile = ['jweixin-1.0.0.js', 'lame.min.js', 'modernizr.custom.js', 'chaiAssert.js'];
    for fname in os.listdir(dirname):
        fullname = dirname + "\\" + fname;
        #print(fullname)
        if os.path.isdir(fullname) :
           if (fname not in blacklist): 
              onedir(fullname);
            #else :
              #print("skip folder: " + fname);

        else:
          if (fname in blacklistFile): 
              continue
          
          if fname.endswith(".js") or fname.endswith(".html") and not fname.endswith(".min.js"):
             os.system("npx eslint --fix " + fullname);
          #else:
             #print("skip non-js file: " + fname) 

onedir(projectFolders[0]);    
