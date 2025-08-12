'use client';
import Head from "next/head";
import { useState, useRef } from "react";
import axios from "axios";
import { ArrowRightCircle, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const Register = () => {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("username", username);
      formData.append("bio", bio);
      if (avatar) formData.append("avatar", avatar);

      const res = await axios.post(
        "http://127.0.0.1:8000/users/register/",
        formData,
        { withCredentials: true }
      );

      if (res.status === 200 || res.status === 201) {
        router.push("/chat");
      }
    } catch (err) {
      setError(
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register</title>
      </Head>

      <div className="d-flex justify-content-center align-items-center vh-100">
        <form
          className="p-4 border rounded bg-light"
          style={{ minWidth: "350px" }}
          onSubmit={handleSubmit}
        >
          {error && <p className="alert alert-warning">{error}</p>}

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <label className="form-label fw-bold">Email</label>
              <input
                type="email"
                className="form-control mb-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleNext}
                disabled={!email}
              >
                Next
                <ArrowRightCircle size={20} />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <label className="form-label fw-bold">Password</label>
              <input
                type="password"
                className="form-control mb-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <label className="form-label fw-bold">Confirm Password</label>
              <input
                type="password"
                className="form-control mb-3"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="d-flex justify-content-between">
                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-success d-flex align-items-center gap-2"
                  onClick={handleNext}
                  disabled={!password || !confirmPassword}
                >
                  Next
                  <ArrowRightCircle size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <div className="d-flex">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "50px",
                    height: "50px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "50%",
                    cursor: "pointer",
                    overflow: "hidden",
                    marginTop: "10px",
                    marginBottom: "10px",
                    marginRight: "20px"
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <UserPlusIcon size={18} />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <div>
                  {/* <label className="form-label fw-bold">Username</label> */}
                  <input
                    type="text"
                    className="form-control mt-3"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Type your preferred username"
                    required
                  />
                </div>
              </div>
              
              

              <label className="form-label fw-bold">Bio</label>
              <textarea
                className="form-control mb-3"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />

              <div className="d-flex justify-content-between">
                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading}
                >
                  {loading ? "Registering..." : "Register"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default Register;
