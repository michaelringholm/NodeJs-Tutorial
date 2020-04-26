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
    success: function() {
      console.log("login successful!");
    },
    dataType: "application/json",
    contentType: "application/json"
  });
}
