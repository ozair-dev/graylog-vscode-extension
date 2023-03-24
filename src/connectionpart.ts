import * as vscode from 'vscode';
import { GraylogFileSystemProvider } from './fileSystemProvider';
import axios from 'axios';
import { DecorationInstanceRenderOptions,ThemeColor } from 'vscode';
import { replaceLinebreaks, truncateString } from './utils';
const BASE_PATH = `${vscode?.extensions?.getExtension('pdragon.task-graylog')?.extensionPath}/resources/`;
const ICON_PATH='error-inverse.svg';
const errorForeground = new ThemeColor('graylog.errorForeground');
const errorForegroundLight = new ThemeColor('graylog.errorForegroundLight');
const errorMessageBackground: ThemeColor | undefined = new ThemeColor('graylog.errorMessageBackground');
const errorBackground: ThemeColor | undefined = new ThemeColor('graylog.errorBackground');
const errorBackgroundLight: ThemeColor | undefined = new ThemeColor('graylog.errorBackgroundLight');

// const hintBackground: ThemeColor | undefined = new ThemeColor('graylog.hintBackground');
// const hintBackgroundLight: ThemeColor | undefined = new ThemeColor('graylog.hintBackgroundLight');
// const hintForeground = new ThemeColor('graylog.hintForeground');
// const hintForegroundLight = new ThemeColor('graylog.hintForegroundLight');
// const hintMessageBackground: ThemeColor | undefined = new ThemeColor('graylog.hintMessageBackground');

const icon = vscode.window.createTextEditorDecorationType({
  gutterIconPath:`${BASE_PATH}${ICON_PATH}`,
  gutterIconSize:'80%',
  isWholeLine: true,
  backgroundColor: errorBackground
});


export class ConnectionPart{


    public apiUrl:string = "";
    public accountUserName = "";
    public accountPassword = "";
    public workingDirectory="";

    public errors:sourceError[]=[];
    constructor(private graylogFilesystem: GraylogFileSystemProvider,private readonly secretStorage:vscode.SecretStorage){
   //     this.workingDirectory = this.getDefaultWorkingDirectory();
    }


    public async onDidChange(document:vscode.TextDocument){
      let id= document.fileName.replace('/','').split('.')[0];
      let rulesource =await this.GetRuleSource(id);
      rulesource['source']=document.getText();
      delete rulesource['errors'];

      let response; 

      let result:sourceError[] =[];
      try{
        response = await axios.put(
          `${this.apiUrl}/api/system/pipelines/rule/${id}`
          ,rulesource,
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-Requested-By':this.accountUserName
            },
            auth: {
              username: this.accountUserName,
              password: this.accountPassword
            }
          }
        );
      }catch(e){
        if(e.response?.data){
        
          e.response.data.map((edata:any)=>{
            let tempdata:sourceError ={
              type: edata['type'],
              line: edata['line'],
              reason:edata['reason'],
              position_in_line: edata['position_in_line']
            };
            result.push(tempdata);
          });          
        }
      }


      this.errors = result;

      let ranges:vscode.Range[]=[];
      let decorationOptions:vscode.DecorationOptions[] = [];

      result.map((oneresult)=>{
        let line = oneresult.line-1;
        let indexOf = oneresult.position_in_line;
        // let position = new vscode.Position(line, indexOf +1 ); 
        let position = new vscode.Position(line, 1 );
        let position1 = new vscode.Position(line, 10 );
        // document.getWordRangeAtPosition(position)
        let range = new vscode.Range(position,position1);
        if(range) {
          ranges.push(range);
          const decInstanceRenderOptions: DecorationInstanceRenderOptions = {
            after: {
              contentText: truncateString(" "+oneresult.reason,40),
              color: errorForeground,
              backgroundColor: errorMessageBackground
            },
            light:{
              after:{
                backgroundColor: errorBackgroundLight,
                color: errorForegroundLight
              }
            },
          }; 
          decorationOptions.push({
            range,
            renderOptions: decInstanceRenderOptions ,
          });

        }
          
      });


      vscode.window.activeTextEditor?.setDecorations(icon,decorationOptions);
    }

    public async GetRuleSource(id:string){
      try{
        const response = await axios.get(`${this.apiUrl}/api/system/pipelines/rule/${id}`, {
          headers: {
            'Accept': 'application/json'
          },
          auth: {
            username: this.accountUserName,
            password: this.accountPassword
          }
        });

        return response.data;
      }catch(e){
      }
    }
    public async LoginInitialize(){
      let initapiurl:string = "";
      let initusername:string = "";
      let initpassword:string = "";
      
      let attemptCount = 0;
      do{
        
        attemptCount ++;
        if(attemptCount == 10){
          vscode.window.showInformationMessage("You tried many times. Plz try again a little later.");
          return;
        }

        if(initapiurl.length==0)
          initapiurl = await vscode.window.showInputBox({
            placeHolder: 'Please type Graylog API Url',
            ignoreFocusOut: true,
            prompt:'Type your api url (http://10.10.10.10)'
          }) ?? "";

          if(!(await this.testAPI(initapiurl)))
          {
            vscode.window.showErrorMessage("API url is not valid.");
            initapiurl = "";
            continue;
          }
          if(initapiurl.substring(initapiurl.length-1) == "/" || initapiurl.substring(initapiurl.length-1) == "\\"){
            initapiurl = initapiurl.substring(0,initapiurl.length-1);
          }
          if(initusername =="")
            initusername = await vscode.window.showInputBox({
              placeHolder: 'Plz type the username',
              ignoreFocusOut: true,
              prompt:'plz type your graylog username'
            }) ?? "";

          if(initusername == ""){
            vscode.window.showErrorMessage("Username cannot be empty");
            continue;
          }

          if(initpassword =="")
            initpassword = await vscode.window.showInputBox({
              placeHolder: 'Plz type the password',
              ignoreFocusOut: true,
              prompt:'plz type your graylog password',
              password: true
            }) ?? "";
          if(initpassword =="")
          {
            vscode.window.showErrorMessage("Password cannot be empty.");
            continue;
          }

          if(!await this.testUserInfo(initapiurl,initusername,initpassword)){
            vscode.window.showErrorMessage("User Info is not valid");
            initusername = "";
            initpassword = "";
            continue;
          }

          this.accountPassword = initpassword;
          this.accountUserName = initusername;
          if(initapiurl.includes("/api")){
            this.apiUrl = initapiurl.substring(0,initapiurl.indexOf("/api"))
          }else{
            this.apiUrl = initapiurl;
          }

          await this.secretStorage.store("grayloguser",this.accountPassword);
          await this.secretStorage.store("graylogpassword",this.accountUserName);
          await this.secretStorage.store("graylogurl",this.apiUrl);
          break;
        }while(true);

        vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('graylog:/'), name: "Graylog API" });
    }

    public async restoreUserInfo(){
      this.accountPassword = await this.secretStorage.get("graylogpassword")??"";
      this.accountUserName = await this.secretStorage.get("grayloguser")??"";
      this.apiUrl = await this.secretStorage.get("graylogurl")??"";
    }
    public  async testAPI(apiPath:string):Promise<boolean>{
        try{
            const res  = await axios.get(apiPath);
            if(res.status == 200)
                return true;
            else return false;
        }catch(e){
            return false;
        }
    }

    public async testUserInfo(apiPath:string, username:string, password:string):Promise<boolean>{
        try{
            let path="";
            if(apiPath.includes("/api")){
                path = apiPath.substring(0,apiPath.indexOf("/api"));
            }else path = apiPath;

            const res  = await axios.get(`${path}/api/cluster`, {
                params: {
                  'pretty': 'true'
                },
                headers: {
                  'Accept': 'application/json'
                },
                auth: {
                  username: username,
                  password: password
                }
              });
              
              if(Object.keys(res.data).length > 0)
              {
                this.accountUserName = username;
                this.accountPassword = password;
                this.apiUrl = apiPath;
                return true;
              }  

              return false;
        }catch(e){
            return false;
        }
    }

    public async prepareForwork(){
      let rules =await this.GetAllRules();
      rules.map((rule)=>{
        this.graylogFilesystem.writeFile(vscode.Uri.parse(`graylog:/${rule['id']}.grule`), Buffer.from(rule['source']), { create: true, overwrite: true });
      });
    }
    public async GetAllRules():Promise<[]>{
      await this.restoreUserInfo();
      try{
        const response = await axios.get(`${this.apiUrl}/api/system/pipelines/rule`, {
          headers: {
            'Accept': 'application/json'
          },
          auth: {
            username: this.accountUserName,
            password: this.accountPassword
          }
        });

        return response.data;
      }catch(e){
      }
      return [];
    }
    initializeDirectories(){
    }
}

export interface sourceError{
  line: number,
  position_in_line: number,
  reason: string,
  type: string
}
