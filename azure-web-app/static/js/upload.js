$(function() {
  console.log("jquery init called!");
  const azureBlobStoreClient = new AzureBlobStoreClient();
  azureBlobStoreClient.listFiles();

  $("#fileUploadDropZone").get(0).dropzone.options.maxFilesize = 8*1024; // 8GB
  $("#fileUploadDropZone").get(0).dropzone.options.timeout = 600 * 1000; // 10 minutes
  $("#fileUploadDropZone").get(0).dropzone.on("complete", function(file, xhr, formData) {
    azureBlobStoreClient.listFiles();
  });
  $(".blobItem").click(azureBlobStoreClient.downloadFile);
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
          $("#blobList").append(newBlobItem);
        }
        console.log("Done listing files in Azure blob store.");
      },
      error: function(xhr, status, reason) {
        console.log("Listing files from Azure blob store failed!");
      },
      //dataType: "application/json",
      contentType: "application/json"
    });    
  };

  this.downloadFile = function() {
    console.log("Downloading file from Azure blob store...");
    var data = { fileName = $(this) };
    $.ajax({
      type: "POST",
      url: "download-file",
      data: JSON.stringify(data),
      success: function(response, status, xhr) {
        var contentType = xhr.getResponseHeader("Content-Type");
        var authorization = xhr.getResponseHeader("Authorization");
        document.cookie = "Authorization=" + authorization + ";" 
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