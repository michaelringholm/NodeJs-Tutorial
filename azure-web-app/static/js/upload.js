$(function() {
  console.log("jquery init called!");
  const azureBlobStoreClient = new AzureBlobStoreClient();
  azureBlobStoreClient.listFiles();
  //$("div#rrr").dropzone({ url: "/upload" });
  //wireupFileUploadEvent();

  //Dropzone.autoDiscover = false;

  /*$('#someDiv').dropzone({
      url: "upload",
      init: function () {
            this.on("success", function (file, response) {
                alert(response); // or alert(file.xhr.response);
            });
        }
  });*/


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
}

/*function wireupFileUploadEvent() {
  console.log("Uploading file...");
  const fileInput = document.getElementById("inputFile");

  const uploadFileFunc = file => {    
    const API_ENDPOINT = "upload";
    const request = new XMLHttpRequest();
    const formData = new FormData();

    $("#uploadStatus").html("Upload started...");
    $("#uploadStatusBlock").show();
    request.open("POST", API_ENDPOINT, true);
    request.onreadystatechange = () => {
      if (request.readyState === 4 && request.status === 200) {
        $("#uploadStatus").html("Upload complete.");
        $("#uploadStatusBlock").hide();
        $("#inputFile").val("");
      }
    };
    formData.append("file", file);
    request.send(formData);
  };

  fileInput.addEventListener("change", event => {
    const files = event.target.files;
    uploadFileFunc(files[0]);
  }); 
}*/