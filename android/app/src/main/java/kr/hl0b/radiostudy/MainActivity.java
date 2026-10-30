package kr.hl0b.radiostudy;

import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.Color;
import android.net.Uri;
import android.webkit.*;
import android.view.*;
import android.widget.*;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;

/** Local-only WebView shell. No INTERNET permission, third-party SDKs or remote JS. */
public final class MainActivity extends Activity {
 private static final String ORIGIN="https://appassets.androidplatform.net";
 private static final String START=ORIGIN+"/assets/index.html";
 private static final int PICK=41, EXPORT=42, MAX=2*1024*1024;
 private WebView web;
 private android.content.SharedPreferences prefs;
 private ValueCallback<Uri[]> chooser;
 private String pendingExport;
 private boolean leaving;
 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  prefs=getSharedPreferences("progress",MODE_PRIVATE);
  if(state!=null&&state.getBoolean("hasExport")){try(java.io.FileInputStream f=openFileInput("pending-export.json");java.io.ByteArrayOutputStream b=new java.io.ByteArrayOutputStream()){byte[] chunk=new byte[4096];int n;while((n=f.read(chunk))!=-1){b.write(chunk,0,n);if(b.size()>MAX)throw new IOException();}pendingExport=b.toString("UTF-8");}catch(IOException ignored){}}
  android.widget.FrameLayout root=new android.widget.FrameLayout(this);
  root.setBackgroundColor(Color.rgb(245,246,241));
  web=new WebView(this);root.addView(web);setContentView(root);
  if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,()->handleBack());
  // Android 15/16 edge-to-edge: keep the whole WebView outside system bars and keyboard.
  root.setOnApplyWindowInsetsListener((v,insets)->{
   if(Build.VERSION.SDK_INT>=30){android.graphics.Insets b=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());v.setPadding(b.left,b.top,b.right,b.bottom);}
   else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
   return insets;
  });root.requestApplyInsets();
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);
  s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  s.setSupportMultipleWindows(false);s.setJavaScriptCanOpenWindowsAutomatically(false);
  web.setBackgroundColor(Color.rgb(245,246,241));
  web.addJavascriptInterface(new LocalBridge(),"RadioAndroid");
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
    Uri u=request.getUrl();String path=u.getPath();
    if(!"https".equals(u.getScheme())||!"appassets.androidplatform.net".equals(u.getHost())||u.getPort()!=-1||path==null||!path.startsWith("/assets/")||path.contains(".."))return blocked();
    try {String file=path.substring(8);String mime=file.endsWith(".html")?"text/html":file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":file.endsWith(".json")?"application/json":file.endsWith(".png")?"image/png":file.endsWith(".svg")?"image/svg+xml":"application/octet-stream";
     return new WebResourceResponse(mime,"UTF-8",getAssets().open(file));
    }catch(IOException e){return blocked();}
   }
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
    Uri u=request.getUrl();if(START.equals(u.toString()))return false;
    // Only user-initiated external references leave the app, in the system browser.
    if(request.isForMainFrame()&&request.hasGesture()&&("https".equals(u.getScheme())||"http".equals(u.getScheme())))openExternal(u);
    return true;
   }
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onJsConfirm(WebView v,String url,String message,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("확인",(d,w)->result.confirm()).setNegativeButton("취소",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}
   @Override public boolean onJsAlert(WebView v,String url,String message,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("확인",(d,w)->result.confirm()).setOnCancelListener(d->result.confirm()).show();return true;}
   @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams parameters){
    if(chooser!=null)chooser.onReceiveValue(null);chooser=callback;
    Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");intent.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/json","text/plain","application/octet-stream"});
    try{startActivityForResult(intent,PICK);}catch(ActivityNotFoundException e){chooser.onReceiveValue(null);chooser=null;notifyUser("파일 선택 앱을 찾을 수 없어요.");}return true;
   }
  });
  web.loadUrl(START);
 }
 private WebResourceResponse blocked(){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",java.util.Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
 private void openExternal(Uri uri){try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(ActivityNotFoundException e){notifyUser("링크를 열 브라우저가 없어요.");}}
 private void notifyUser(String text){runOnUiThread(()->Toast.makeText(this,text,Toast.LENGTH_LONG).show());}
 private String validJson(String text)throws Exception{if(text==null||text.getBytes(StandardCharsets.UTF_8).length>MAX)throw new Exception();JSONObject p=new JSONObject(text);if(!(p.opt("records") instanceof JSONObject)||!(p.opt("marks") instanceof org.json.JSONArray))throw new Exception();return text;}
 public final class LocalBridge {
  @JavascriptInterface public String load(){String data=prefs.getString("current","");try{return validJson(data);}catch(Exception e){try{return validJson(prefs.getString("backup",""));}catch(Exception ignored){return "";}}}
  @JavascriptInterface public boolean save(String json){try{validJson(json);return prefs.edit().putString("backup",prefs.getString("current","")).putString("current",json).commit();}catch(Exception e){return false;}}
  @JavascriptInterface public void exportProgress(String json){try{validJson(json);}catch(Exception e){notifyUser("기록 형식을 확인해 주세요.");return;}
   runOnUiThread(()->{if(pendingExport!=null){notifyUser("먼저 열려 있는 저장 창을 마쳐 주세요.");return;}pendingExport=json;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/json");i.putExtra(Intent.EXTRA_TITLE,"radio-study-progress.json");try{startActivityForResult(i,EXPORT);}catch(ActivityNotFoundException e){pendingExport=null;notifyUser("파일 저장 앱을 찾을 수 없어요.");}});
  }
 }
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);
  if(request==PICK&&chooser!=null){Uri[] files=result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null;chooser.onReceiveValue(files);chooser=null;}
  if(request==EXPORT){String text=pendingExport;pendingExport=null;deleteFile("pending-export.json");if(result==RESULT_OK&&data!=null&&data.getData()!=null&&text!=null){try(OutputStream stream=getContentResolver().openOutputStream(data.getData(),"wt")){if(stream==null)throw new IOException();stream.write(text.getBytes(StandardCharsets.UTF_8));notifyUser("풀이 기록을 저장했어요.");}catch(IOException e){notifyUser("파일을 저장하지 못했어요. 다시 시도해 주세요.");}}}
 }
 @Override protected void onSaveInstanceState(Bundle out){super.onSaveInstanceState(out);if(pendingExport!=null){try(java.io.FileOutputStream f=openFileOutput("pending-export.json",MODE_PRIVATE)){f.write(pendingExport.getBytes(StandardCharsets.UTF_8));out.putBoolean("hasExport",true);}catch(IOException ignored){}}}
 @Override public void onBackPressed(){handleBack();}
 private void handleBack(){
  if(leaving)return;web.evaluateJavascript("(function(){if(!document.querySelector('.workspace').hidden||!document.getElementById('mockPanel').hidden){document.getElementById('homeTab').click();return true;}return false;})()",value->{if(!"true".equals(value)){leaving=true;new AlertDialog.Builder(this).setMessage("앱을 닫을까요? 풀이 기록은 저장되며, 진행 중인 시험 시간은 계속 흘러갑니다.").setPositiveButton("닫기",(d,w)->finish()).setNegativeButton("계속 공부",(d,w)->leaving=false).setOnCancelListener(d->leaving=false).show();}});
 }
 @Override protected void onResume(){super.onResume();if(web!=null){web.onResume();web.evaluateJavascript("window.dispatchEvent(new Event('radio-resume'))",null);}}
 @Override protected void onPause(){if(web!=null)web.onPause();super.onPause();}
 @Override protected void onDestroy(){if(chooser!=null)chooser.onReceiveValue(null);if(web!=null){web.removeJavascriptInterface("RadioAndroid");web.destroy();}super.onDestroy();}
}
