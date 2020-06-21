$(function() {
  console.log("jquery init called!");
  const azureBlobStoreClient = new AzureBlobStoreClient();
  azureBlobStoreClient.listFiles();

  $("#fileUploadDropZone").get(0).dropzone.options.maxFilesize = 8*1024; // 8GB
  $("#fileUploadDropZone").get(0).dropzone.options.timeout = 600 * 1000; // 10 minutes
  $("#fileUploadDropZone").get(0).dropzone.on("complete", function(file, xhr, formData) {
    azureBlobStoreClient.listFiles();
  });  
});

function AzureBlobStoreClient() {
  var _this = this;

  this.listFiles = function() {
    console.log("Listing files in Azure blob store...");
    var data = {  };
    $.ajax({
      type: "POST",
      url: "list-files",
      data: JSON.stringify(data),
      success: function(response, status, xhr) {
        var contentType = xhr.getResponseHeader("Content-Type");
        var authorization = xhr.getResponseHeader("Authorization");
        document.cookie = "Authorization=" + authorization + ";" 
        $("#blobList").empty();
        for(var blobListIndex in response.blobList) {
          var blobItem = response.blobList[blobListIndex];
          var newBlobItem = $("#blobItemTemplate").clone();
          $(newBlobItem).removeAttr("id");
          $(newBlobItem).removeClass("template");
          $(newBlobItem).find(".name").html(blobItem.name);
          $(newBlobItem).find(".createdDate").html(blobItem.properties.createdOn);
          $(newBlobItem).find(".contentLength").html(blobItem.properties.contentLength);
          $(newBlobItem).find(".blobDownloadLink").attr("href", "download-file/" + blobItem.name);          
          $("#blobList").append(newBlobItem);
        }
        //$(".blobItem").click(_this.downloadFile);
        console.log("Done listing files in Azure blob store.");
      },
      error: function(xhr, status, reason) {
        console.log("Listing files from Azure blob store failed!");
      },
      //dataType: "application/json",
      contentType: "application/json"
    });    
  };

  this.downloadFile = function(event) {
    console.log("Downloading file from Azure blob store...");
    var target = event.target;
    var blobItem = $(target).closest(".blobItem");
    var blobName = $(blobItem).find(".name").text();
    var data = { blobName : blobName };
    $.ajax({
      type: "POST",
      url: "download-file",
      data: JSON.stringify(data),
      success: function(response, status, xhr) {
        var contentType = xhr.getResponseHeader("Content-Type");
        var authorization = xhr.getResponseHeader("Authorization");
        document.cookie = "Authorization=" + authorization + ";" 

        //var a = document.createElement('a');
        //a.href = window.URL.createObjectURL(response);
        // Give filename you wish to download
        // Just make a pseudo link <a> instead of all this
        /*a.download = "test-file.txt";
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();*/
        /*response.blob().then(blob => {
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          console.log(url);
          link.href = url;
          link.download = '111.txt';
          link.click();
        });        */
        /*$("#blobList").empty();
        for(var blobListIndex in response.blobList) {
          var blobItem = response.blobList[blobListIndex];
          var newBlobItem = $("#blobItemTemplate").clone();
          $(newBlobItem).removeAttr("id");
          $(newBlobItem).removeClass("template");
          $(newBlobItem).find(".name").html(blobItem.name);
          $(newBlobItem).find(".createdDate").html(blobItem.properties.createdOn);
          $(newBlobItem).find(".contentLength").html(blobItem.properties.contentLength);
          $("#blobList").append(newBlobItem);
        }*/
        console.log("Done downloading file from Azure blob store.");
      },
      error: function(xhr, status, reason) {
        console.log("Downloading file from Azure blob store failed!");
      },
      //dataType: "application/json",
      contentType: "application/json"
    });    
  };  
}