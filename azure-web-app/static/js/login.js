$(function() {
  console.log("jquery init called!");
  $("#btnLogin").click(function() {login(); });
});

function login() {
  var data = { password : $("#password").val() };
  $.ajax({
    type: "POST",
    url: "login",
    data: JSON.stringify(data),
    success: function(response, status, xhr) {
      console.log("login successful!");
      var contentType = xhr.getResponseHeader("Content-Type");
      var authorization = xhr.getResponseHeader("Authorization");
      document.cookie = "Authorization=" + authorization + ";" 
      window.location.href = "/index";
    },
    error: function(xhr, status, reason) {
      console.log("login failed!");
    },
    //dataType: "application/json",
    contentType: "application/json"
  });
}
