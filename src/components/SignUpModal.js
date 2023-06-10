import { useState } from 'react';
import './styles/SignUpModal.css'

const SignUpModal = ({ open, onClose, onSignUp, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [logginIn, setLogginIn] = useState(false);

    const handleConfirm = () => {
        if (!email || !password) {
            alert('Please fill out all fields');
            return;
        }
        if (logginIn) {
            onLogin(email, password);
        } else {
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            onSignUp(email, password);
        }
    }
    
    return (
        <div className={`small-modal ${open ? 'open' : ''}`}>
            <div className="small-modal-content">
                <div className="small-modal-header">
                    <h4 className="small-modal-title">{logginIn ? 'Log In' : 'Sign Up'}</h4>
                </div>
                <div className="small-modal-body">
                    <form className="small-modal-form">
                        <div className="input-field-container">
                            <input
                                type={'text'}
                                id={"email"}
                                placeholder=""
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={!email ? '' : 'non-empty'}
                            />
                            <label htmlFor={"email"}>Email</label>
                        </div>
                        <div className="input-field-container">
                            <input
                                type={'password'}
                                id={"password"}
                                placeholder=""
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={!password ? '' : 'non-empty'}
                            />
                            <label htmlFor={"password"}>Password</label>
                        </div>
                        {!logginIn &&
                        <div className="input-field-container">
                            <input
                                type={'password'}
                                id={"confirm-password"}
                                placeholder=""
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={!confirmPassword ? '' : 'non-empty'}
                            />
                            <label htmlFor={"confirm-password"}>Confirm Password</label>
                        </div>}
                    </form>
                </div>
                <div className="small-modal-footer">
                    <button className="small-modal-button redwhite" onClick={onClose}>Cancel</button>
                    <button className="small-modal-button green" onClick={handleConfirm}>{logginIn ? 'Log In' : 'Sign Up'}</button>
                </div>
                <p className="small-modal-footer-text" onClick={() => setLogginIn(!logginIn)}>{logginIn ? 'Don\'t have an account? Sign up' : 'Already have an account? Log in'}</p>
            </div>
        </div>
    );
}

export default SignUpModal;
