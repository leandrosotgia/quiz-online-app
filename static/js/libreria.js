function sendRequest(url, method, parameters, callback) {
	$.ajax({
		url: url,
		type: method,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		dataType: "text",
		data: parameters,
		timeout: 6000000,
		success: callback,
		error: function (jqXHR, test_status, str_error) {
			//console.log("No connection to " + link);
			//console.log("Test_status: " + test_status);
			alert("Error: " + str_error);
		}
	});
}

function sendRequestNoCallback(url, method, parameters) {
	let mycontentType;
	if (method.toUpperCase() == "GET")
		mycontentType = "application/x-www-form-urlencoded; charset=UTF-8";
	else {
		mycontentType = "application/json; charset=UTF-8";
		parameters = JSON.stringify(parameters);
	}
	return $.ajax({
		url: url,
		contentType: mycontentType,
		type: method,
		dataType: "text",
		data: parameters,
		headers: { token: "Bearer " + localStorage.getItem("token") },
		timeout: 5000
	});
}

function error(jqXHR, testStatus, strError) {
	/*if (jqXHR.status == 0)
		console.log("server timeout");
	else if (jqXHR.status == 200)
		console.log("Formato dei dati non corretto : " + jqXHR.responseText);
	else
		console.log("Server Error: " + jqXHR.status + " - " + jqXHR.responseText);*/
	let code = jqXHR.status;
	let message = jqXHR.responseText;
	if (code == 0)
		alert("Server TimeOut");
	else {
		//if(message != "Token inesistente")
		alert("Errore Login. Codice Errore: " + code + " - " + message);
	}
}