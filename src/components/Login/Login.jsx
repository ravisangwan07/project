import React, { useState, useContext, useEffect } from 'react';
import 
{ 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    signOut, 
    signInWithEmailLink, 
    sendSignInLinkToEmail, 
    isSignInWithEmailLink, 
    EmailAuthProvider, 
    getAuth, 
    linkWithCredential, 
    updatePassword,
}   from "firebase/auth";

import './Login.css';
import { authenticate, db } from '../../helper/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { doLogin } from '../../auth';
import './Login.css';
import imgSrc from "../../assets/logo-google.png";
import connect from '../../assets/connect.png'
import { useDispatch } from 'react-redux';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserAuth } from '../../context/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const {signIn} = UserAuth();
    
    useEffect(() => {
        if (isSignInWithEmailLink(authenticate, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }
            signInWithEmailLink(authenticate, email, window.location.href)
                .then((result) => {
                    window.localStorage.removeItem('emailForSignIn');
                    const user = result.user;
                    const mypassword = window.prompt("Password");
                    const credentials = EmailAuthProvider.credential(email, mypassword);
                    const auth = getAuth();
                    console.log(auth.currentUser);
                    updatePassword(auth.currentUser, mypassword)
                    .then((usercred) => {
                        const User = usercred.user;
                        console.log("Account linking success", User);
                    }).catch((error) => {
                        console.log("Account linking error", error);
                    });
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error(errorCode, errorMessage);
                });
        }
    }, []);


    const handleLogin = (e) => {
        e.preventDefault();
        signInWithPopup(authenticate, new GoogleAuthProvider())
            .then((creds) => {

                const DATA = {
                    ...creds.user.providerData[0],
                    id_: creds.user.uid
                }
                doLogin(DATA, () => {
                    console.log("login detail is saved to localstorage");

                    getDoc(doc(db, 'users', creds.user.uid)).then((rdata) => {
                        if(!rdata.exists){
                            setDoc(doc(db, 'users', creds.user.uid), {
                                email : creds.user.email,
                                username : creds.user.displayName,
                                followers : 0,
                                following : 0,
                                photoUrl : creds.user.photoURL
                            }).then(() => {
                                window.alert('Account Created Successfully.')
                            }).catch((e) => {
                                window.alert(`${e}`);
                            })
                        }else{
                            dispatch({
                                type: 'SET_USER',
                                payload: { ...rdata.data(), id: creds.user.uid }
                            })
                        }
                    }).catch(err => console.log(err))


                    // //redirect to user dashboard page
                    // setUser({
                    //     ...DATA,
                    //     login: true
                    // });
                    navigate("/");
                });
            })
            .catch((e) => {
                console.log(e);
            })
    }

    const handleEmailPassRegister = (e) => {
        e.preventDefault();
        sendSignInLinkToEmail(authenticate, email, {
            url: 'http://localhost:3000/login/?email=' + email,
            handleCodeInApp: true,
        }).then(() => {
            window.localStorage.setItem('emailForSignIn', email);
            window.alert(`Verification and SignIn Link Send to email ${email}`);
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(errorCode, errorMessage);
        });
    }

    const handleEmailPassLogin = (e) => {
        e.preventDefault();
        signIn(email, password);
        // signInWithEmailAndPassword(authenticate, email, password).then((creds) => {
        //     const DATA = {
        //         ...creds.user.providerData[0],
        //         id_: creds.user.uid
        //     }
        //     doLogin(DATA, () => {
        //         console.log("login detail is saved to localstorage");

        //         getDoc(doc(db, 'users', creds.user.uid)).then((rdata) => {
        //             dispatch({
        //                 type: 'SET_USER',
        //                 payload: { ...rdata.data(), id: creds.user.uid }
        //             })
        //         }).catch(err => console.log(err))


        //         //redirect to user dashboard page
        //         setUser({
        //             ...DATA,
        //             login: true
        //         });
        //         navigate("/");
        //     });
        // }).catch(err => {
        //     window.alert(err);
        // });
    }

    return (
        <div className="login_page">
            <div className="login_box">
                <div className='login-logo'>
                    <img src={connect} alt="Logo" />
                </div>
                <div className='login-ep'>
                    <form onSubmit={handleEmailPassLogin}>
                        <input
                            onChange={(e) => {
                                setEmail(e.target.value);
                            }}
                            className='login-cred'
                            value={email}
                            type="email"
                            placeholder='Email' />

                        <input
                            onChange={(e) => {
                                setPassword(e.target.value);
                            }}
                            className='login-cred'
                            type="password"
                            value={password}
                            placeholder='Password' />

                        <button
                            className='login-btn'
                            type='submit'
                        >Log in</button>
                    </form>
                </div>
                <div className='log-divider'><span>OR</span></div>
                <button onClick={handleLogin}><img src={imgSrc} />Sign in With Google</button>
                <div className='log-divider'><span>OR</span></div>
                <div className='login-reg'>
                    <p>Don't have an account ?</p><Link className='reg-link' to='/register'>Sign up</Link>
                </div>
            </div>
        </div>
    )
}

export default Login