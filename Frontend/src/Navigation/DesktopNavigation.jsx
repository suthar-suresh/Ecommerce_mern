import "./Desktop.css";
import React, { useContext, useEffect, useState } from "react";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import {
  AiOutlineHeart,
  AiOutlineShoppingCart,
  AiFillCloseCircle,
} from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import { FiLogOut } from "react-icons/fi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  InputLabel,
  Menu,
  MenuItem,
  Slide,
  Tooltip,
  Typography,
} from "@mui/material";
import { ContextFunction } from "../Context/Context";
import { toast } from "react-toastify";
import {
  getCart,
  getWishList,
  handleLogOut,
  handleClickOpen,
  handleClose,
  Transition,
} from "../Constants/Constant";
import axios from "axios";

const DesktopNavigation = () => {
  const { cart, setCart, wishlistData, setWishlistData } =
    useContext(ContextFunction);
  const [openAlert, setOpenAlert] = useState(false);
  const navigate = useNavigate();
  let authToken = localStorage.getItem("Authorization");
  const [userImage, setuserImage] = useState("");
  let setProceed = authToken !== null ? true : false;
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_GET_USER_DETAILS}`,
          {
            headers: {
              Authorization: authToken,
            },
          }
        );

        setuserImage(data.userImage);
      } catch (error) {
        toast.error("Something went wrong", {
          autoClose: 500,
          theme: "colored",
        });
      }
    };
    if(authToken)getUserData();
    getCart(setProceed, setCart, authToken);
    getWishList(setProceed, setWishlistData, authToken);
  }, [authToken]);

  return (
    <>
      <nav className="nav">
        <div className="logo">
          <Link to="/">
            <span>Shop It</span>
          </Link>
        </div>
        <div className="nav-items">
          <ul className="nav-items">
            <li className="nav-links">
              <NavLink to="/">
                <span className="nav-icon-span"> Home</span>
              </NavLink>
            </li>
            {/* <li className="nav-links">
              <NavLink to='/contact'>
                <span className='nav-icon-span'>  Contact Us</span>
              </NavLink>
            </li> */}

            <li className="nav-links">
              <Tooltip title="Cart">
                <NavLink to="/cart">
                  <span className="nav-icon-span">
                    Cart{" "}
                    <Badge badgeContent={setProceed ? cart.length : 0}>
                      {" "}
                      <AiOutlineShoppingCart className="nav-icon" />
                    </Badge>
                  </span>
                </NavLink>
              </Tooltip>
            </li>
            <li className="nav-links">
              <Tooltip title="Wishlist">
                <NavLink to="/wishlist">
                  <span className="nav-icon-span">
                    Wishlist{" "}
                    <Badge badgeContent={setProceed ? wishlistData.length : 0}>
                      {" "}
                      <AiOutlineHeart className="nav-icon" />
                    </Badge>
                  </span>
                </NavLink>
              </Tooltip>
            </li>

            {setProceed ? (
              <>
                <li className="nav-links">
                  <Tooltip title="Profile">
                    <>
                      <FormControl sx={{ m: 1, minWidth: 80, minHeight: 2 }}>
                        <InputLabel id="demo-simple-select-autowidth-label">
                          {!userImage?.length > 0 ? (
                            <span className="nav-icon-span">
                              <CgProfile
                                style={{
                                  fontSize: 29,
                                  marginTop: 7,
                                  marginRight: 10,
                                }}
                              />
                            </span>
                          ) : (
                            <img
                              src={userImage}
                              style={{ height: "38px", borderRadius: "100%" }}
                            />
                          )}
                        </InputLabel>
                        <Select
                          labelId="demo-simple-select-autowidth-label"
                          id="demo-simple-select-autowidth"
                          autoWidth
                          label="Age"
                        >
                          <MenuItem value=""></MenuItem>
                          <MenuItem>
                            <NavLink to={"/update"}>updateUser</NavLink>
                          </MenuItem>
                          <MenuItem>
                            <NavLink to={"/myorder"}>MyOrder</NavLink>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </>
                  </Tooltip>
                </li>
                <li
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyItems: "center",
                  }}
                  onClick={() => handleClickOpen(setOpenAlert)}
                >
                  <Button
                    variant="contained"
                    className="nav-icon-span"
                    sx={{ marginBottom: 1 }}
                    endIcon={<FiLogOut />}
                  >
                    <Typography variant="button"> Logout</Typography>
                  </Button>
                </li>
              </>
            ) : (
              <li className="nav-links">
                <Tooltip title="Login">
                  <NavLink to="/login">
                    <span className="nav-icon-span">
                      {" "}
                      <CgProfile style={{ fontSize: 29, marginTop: 7 }} />
                    </span>
                  </NavLink>
                </Tooltip>
              </li>
            )}
          </ul>
        </div>
      </nav>
      <Dialog
        open={openAlert}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogContent
          sx={{
            width: { xs: 280, md: 350, xl: 400 },
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Typography variant="h6"> Do You Want To Logout?</Typography>
        </DialogContent>
        <DialogActions sx={{ display: "flex", justifyContent: "space-evenly" }}>
          <Link to="/">
            <Button
              variant="contained"
              endIcon={<FiLogOut />}
              color="primary"
              onClick={() =>
                handleLogOut(setProceed, toast, navigate, setOpenAlert)
              }
            >
              Logout
            </Button>
          </Link>
          <Button
            variant="contained"
            color="error"
            endIcon={<AiFillCloseCircle />}
            onClick={() => handleClose(setOpenAlert)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DesktopNavigation;
