import React, { useState } from 'react';
import axios from '../axios';

export default function JudgeRegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    password2: '',
    name: '',
    surname: '',
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Registering...');
    try {
      // Step 1: Register the judge
      await axios.post('auth/register/', formData);

      // Step 2: Log in automatically to get the token
      const loginRes = await axios.post('token-auth/', {
        username: formData.username,
        password: formData.password
      });

      const token = loginRes.data.token;
      localStorage.setItem('token', token);
      setMessage(`Registration complete. Logged in as judge ${token}`);

    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        JSON.stringify(error.response?.data || 'Registration/Login failed')
      );
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Judge Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="text" name="name" placeholder="Ime" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="text" name="surname" placeholder="Priimek" value={formData.surname} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="password" name="password2" placeholder="Confirm Password" value={formData.password2} onChange={handleChange} className="w-full p-2 border rounded" required />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Register</button>
        {message && <p className="text-sm mt-2 text-center">{message}</p>}
      </form>
    </div>
  );
}
