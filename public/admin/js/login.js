document.getElementById('email')
  .addEventListener('input', () => clearError('email'));

document.getElementById('password')
  .addEventListener('input', () => clearError('password'));

document.addEventListener('keydown', (e)=>{
  if(e.key === "Enter") handleLogin();
});

document.getElementById("signInBtn")
  .addEventListener("click", handleLogin);


function clearError(field){
  document.getElementById(field).classList.remove('error');
  document.getElementById(field+'Error').classList.remove('show');
}

function showAlert(message,type="error"){
  const box = document.getElementById("alertBox");
  box.textContent = message;
  box.className = `alert alert-${type} show`;
}

function hideAlert(){
  document.getElementById("alertBox").classList.remove("show");
}

function setLoading(loading){
  const btn = document.getElementById("signInBtn");
  const text = document.getElementById("btnText");
  const spinner = document.getElementById("spinner");

  btn.disabled = loading;
  text.textContent = loading ? "Signing in..." : "Sign In";
  spinner.classList.toggle("show",loading);
}

function validate(email,password){

  let valid = true;

  const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if(!email || !emailRegex.test(email)){
    document.getElementById("email").classList.add("error");
    document.getElementById("emailError").classList.add("show");
    valid=false;
  }

  if(!password){
    document.getElementById("password").classList.add("error");
    document.getElementById("passwordError").classList.add("show");
    valid=false;
  }

  return valid;
}


async function handleLogin(){

  hideAlert();

  const email =
  document.getElementById("email").value.trim();

  const password =
  document.getElementById("password").value;

  if(!validate(email,password)) return;

  setLoading(true);

  try{

    const response = await axios.post("/admin/login",{
      email,
      password
    });

    if(response.data.success){

      showAlert("Login successful! Redirecting...","success");

      setTimeout(()=>{
        window.location.href =
        response.data.redirectUrl || "/admin/dashboard";
      },800);

    }else{
      showAlert(response.data.message);
    }

  }catch(err){

    if(err.response){
      showAlert(err.response.data.message || "Invalid credentials");
    }else{
      showAlert("Network error. Try again.");
    }

  }finally{
    setLoading(false);
  }

}
