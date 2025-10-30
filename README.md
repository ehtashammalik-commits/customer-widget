
## Deployment
The Customer Widget is an angular application that can be deployed on any web-server. It can also be deployed on Apache Tomcat, IIS server, or similar. For any other server, follow the official deployment guide of the relevant application server.

## Embed in Website
After a successful deployment, add the following script in the head section of your website to embed the widget in your website.

```html
<!-- CIM Script Tags -->
    <script type="text/javascript">
      var __cim = __cim || {};
      __cim.customerWidgetUrl = "https://[HostName]/customer-widget"; //Customer Widget Url 
      __cim.widgetIdentifier = "web"; //Widget Identifier
      __cim.serviceIdentifier = "+921218"; //Service Identifier

      (function () {
        // Append a timestamp to the script URL to disable caching
        var timestamp = new Date().getTime();
        var __cimScript = document.createElement("script"),
        __cimScriptTag = document.getElementsByTagName("script")[0];
        __cimScript.src = `${__cim.customerWidgetUrl}/widget-assets/widget/init_widget.js?cache=${timestamp}`;
        __cimScript.charset = "UTF-8";
        __cimScriptTag.parentNode.insertBefore(__cimScript, __cimScriptTag);
      })();
    </script>
    <!-- End CIM Script Tags -->
```

## Note: 
1. `Customer Widget Url` is the IP or FQDN of server where Customer Widget is hosted.
2. `Widget Identifier` is the web identifier for CIM chat.
3. `Service Identifier` is the service identifier for CIM chat.



<!-- comment the below line out the index.html for local dev  -->
  <!-- <base href="/customer-widget/"> -->

<!-- uncomment the below line for local dev -->
  <!-- <base href="/"> -->