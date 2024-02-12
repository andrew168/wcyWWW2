import os;

#projectFolders=["."]
# projectFolders=["backOffice"]
projectFolders=["www"]

def onedir(dirname): 
    blacklist = ['.vs', '.vscode', '.idea', '.git', 'dist', 'plugins', 'installationGuide',
                 'wwwKs',
                 'node_modules', 'lib', 'lib-debug-duplicated', 'lib-debug', 'libDefer',
                 'jweixin-1.0.0.js'];
    for fname in os.listdir(dirname):
        fullname = dirname + "\\" + fname;
        #print(fullname)
        if os.path.isdir(fullname) :
           if (fname not in blacklist): 
              onedir(fullname);
            #else :
              #print("skip folder: " + fname);

        else:
          if fname.endswith(".js") or fname.endswith(".html") and not fname.endswith(".min.js"):
             os.system("npx eslint --fix " + fullname);
          #else:
             #print("skip non-js file: " + fname) 

onedir(projectFolders[0]);    
