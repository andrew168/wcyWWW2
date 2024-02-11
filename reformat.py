import os;

projectFolders=["."]

def onedir(dirname): 
    blacklist = ['.vs', '.vscode', '.idea', '.git', 'dist', 'plugins', 'installationGuide',
                 'wwwKs',
                 'node_modules', 'lib', 'lib-debug-duplicated', 'lib-debug', 'libDefer'];
    for fname in os.listdir(dirname):
        fullname = dirname + "\\" + fname;
        print(fullname)
        if os.path.isdir(fullname) :
           if (fname in blacklist): 
              print("skip folder: " + fname);
           else:
              onedir(fullname);
        else:
          if fname.endswith(".js") or fname.endswith(".html")  or fname.endswith(".json") and not fname.endswith(".min.js"):
             os.system("npx eslint --fix " + fullname);
          else:
             print("skip non-js file: " + fname) 

onedir(projectFolders[0]);    
