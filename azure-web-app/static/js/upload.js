$(function() {
  console.log("jquery init called!");
  wireupFileUploadEvent();
});

function wireupFileUploadEvent() {
  console.log("Uploading file...");
  const fileInput = document.querySelector("#inputFile");

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
}