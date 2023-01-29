import os;

projectFolders=[".\\backOffice",  ".\\www"]

def onedir(dirname): 
    blacklist = ['node_modules', 'lib', 'lib-debug-duplicated', 'lib-debug', 'libDefer'];
    for fname in os.listdir(dirname):
        fullname = dirname + "\\" + fname;
        print(fullname)
        if os.path.isdir(fullname) :
           if (fname in blacklist): 
              print("skip folder: " + fname);
           else:
              onedir(fullname);
        else:
          if fname.endswith(".js"):
             os.system("npx eslint --fix " + fullname);
          else:
             print("skip non-js file: " + fname) 

onedir(projectFolders[0]);    
onedir(projectFolders[1]);