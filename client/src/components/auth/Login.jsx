import React, { useState } from 'react';
import { Link } from 'react-router-dom';


const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    
    const { email, password } = formData;

    const onChange = e => setFormData(
        {...formData, [e.target.name]: e.target.value }
    );

    const onSubmit = async e => {
        e.preventDefault();
        console.log('Success');
    }

    return (
        <section className="container">
          <h1 className="large text-primary">Sign In</h1>
          <p className="lead">
            <i className="fas fa-user" /> Sign Into Your Account
          </p>
          <form className="form" onSubmit={onSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                name="email"
                value={email}
                onChange={onChange}
              />
              <small className="form-text">
                This site uses Gravatar so if you want a profile image, use a
                Gravatar email
              </small>
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={password}
                onChange={onChange}
              />
            </div>
            <input type="submit" className="btn btn-primary" value="Login" />
          </form>
          <p className="my-1">
            Do not have an account? <Link to="/register">Sign Up</Link>
          </p>
        </section>
      );
};

export default Login;