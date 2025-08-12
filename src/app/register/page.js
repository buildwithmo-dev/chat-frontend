'use client'
import Head from "next/head";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const Register = () => {
  const router = useRouter();
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError(true);
      setErrorMessage("Passwords do not match.");
      return;
    } 

    try {
        setRegistered(true);
        const response = await axios.post('http://127.0.0.1:8000/users/register/', {
            first_name: firstname,
            last_name: lastname,
            username,
            password,
        },
        { withCredentials: true,}
        );
      if (response.status === 200 || response.status === 201) {
        router.push('/chat');
      }
      setError(false);
    } catch (err) {
      console.error("Axios error:", {
        message: err.message,
        code: err.code,
        response: err.response,
        data: err.response?.data,
      });

      setError(true);
      setErrorMessage(
        err.response?.data?.username?.[0] ||
        err.response?.data?.password?.[0] ||
        "Registration failed. Try again."
      );
    }
    finally {
      setRegistered(false);
    }
  };

  const isFormValid = firstname && lastname && username && password && confirmPassword;

  return (
    <>
      <Head>
        <title>Register</title>
      </Head>
      <div className="d-flex justify-content-center align-items-center vh-100">
        <form className="row w-50 p-4 border rounded bg-light" onSubmit={handleSubmit}>
          {error && <p className="btn btn-warning">{errorMessage}</p>}

          <div className="col-sm-6">
            <label className="form-label" htmlFor="firstname">First Name</label>
            <input
              type="text"
              id="firstname"
              className="form-control"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
            />
          </div>

          <div className="col-sm-6">
            <label className="form-label" htmlFor="lastname">Last Name</label>
            <input
              type="text"
              id="lastname"
              className="form-control"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="col-sm-6">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              className="form-control"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="col-sm-6">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              className="form-control"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button className="mt-3 px-2 btn btn-success" disabled={!isFormValid} type="submit">Register</button>

          {registered && (
            <p className="btn btn-info">Registering...</p>
          )}
        </form>
      </div>
    </>
  );
};

export default Register;
