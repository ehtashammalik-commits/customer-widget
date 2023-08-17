
## Deployment
The web-init is a plain HTML/javascript application that can be deployed on any web-server. It can also be deployed on Apache Tomcat, IIS server, or similar. For any other server, follow the official deployment guide of the relevant application server.

## Embed in Website
After a successful deployment, add the following script in the head section of your website to embed the widget in your website.

```html
<!-- CIM Script Tags -->
    <script type="text/javascript">
      var __cim = __cim || {};
      __cim.initWidgetUrl = "https://[HostName]"; //Init Widget Url
      __cim.customerWidgetUrl = "https://[HostName]/customer-widget"; //Customer Widget Url 
      __cim.widgetIdentifier = "web"; //Widget Identifier
      __cim.serviceIdentifier = "+921218"; //Service Identifier

      (function () {
        var __cimScript = document.createElement("script"),
          __cimScriptTag = document.getElementsByTagName("script")[0];
        __cimScript.src = __cim.initWidgetUrl + "/init_widget.js";
        __cimScript.charset = "UTF-8";
        __cimScriptTag.parentNode.insertBefore(__cimScript, __cimScriptTag);
      })();
    </script>
    <!-- End CIM Script Tags -->
```

## Note: 
1. `Init Widget Url` is the IP or FQDN of the machine where the web-init widget is hosted.
2. `Customer Widget Url` is the IP or FQDN of server where Customer Widget is hosted.
3. `Widget Identifier` is the web identifier for CIM chat.
4. `Service Identifier` is the service identifier for CIM chat.
