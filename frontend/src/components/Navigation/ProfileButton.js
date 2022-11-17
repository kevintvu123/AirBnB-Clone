import React, { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
import { NavLink } from "react-router-dom";
import * as sessionActions from '../../store/session';
import './Navigation.css'

function ProfileButton({ user, setLogin, setShowModal }) {
    const dispatch = useDispatch();
    const [showMenu, setShowMenu] = useState(false);

    const openMenu = () => {
        if (showMenu) return;
        setShowMenu(true);
    };

    useEffect(() => {
        if (!showMenu) return;

        const closeMenu = () => {
            setShowMenu(false);
        };

        document.addEventListener('click', closeMenu);

        return () => document.removeEventListener("click", closeMenu);
    }, [showMenu]);

    const logout = (e) => {
        e.preventDefault();
        dispatch(sessionActions.logout());
    };

    const capitalize = (name) => {
        const firstLetter = name.charAt(0)
        const upperFirstLetter = firstLetter.toUpperCase()
        const restWord = name.slice(1)
        return upperFirstLetter + restWord
    }

    return (
        <>
            <div className="dropdown">
                <button className="profileButton" onClick={openMenu}>
                    <i className="fas fa-user-circle" />
                </button>
                <div className="dropdownMenu">
                    {showMenu && (user ?
                        (<ul className="profile-dropdown">
                            <div className="firstSectionMenu">
                                <div>Hello {capitalize(user.firstName)} {capitalize(user.lastName)}!</div>
                            </div>
                            <div className="secondSectionMenu">
                                <div className="manageDiv">Manage Your: </div>
                                <div className="secondNavLinks"><NavLink style={{ textDecoration: 'none', color: 'black' }} to={'/spots/current'}>Listings</NavLink></div>
                                <div className="secondNavLinks"><NavLink style={{ textDecoration: 'none', color: 'black' }} to={'/reviews/current'}>Reviews</NavLink></div>
                            </div>
                            <div className="buttonDiv">
                                <button className="logoutButton" onClick={logout}>Log Out</button>
                            </div>
                        </ul>) :
                        (<ul className="profile-dropdown">
                            <div>
                                <button className="loginButton" onClick={() => {
                                    setLogin(true)
                                    setShowModal(true)
                                }}>Log In</button>
                            </div>
                            <div className="line"></div>
                            <div>
                                <button className="signupButton" onClick={() => {
                                    setLogin(false)
                                    setShowModal(true)
                                }}>Sign Up</button>
                            </div>
                        </ul>)
                    )}
                </div>
            </div>
        </>
    );
}

export default ProfileButton;