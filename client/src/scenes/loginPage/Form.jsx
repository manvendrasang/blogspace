import { useState } from "react";
import {
    Box,
    Button,
    TextField,
    useMediaQuery,
    Typography,
    useTheme,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Formik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setLogin } from "../../state/index.js";
import Dropzone from "react-dropzone";
import FlexBetween from "../../components/FlexBetween.jsx";

/* -----------------------------
   Validation schemas & initial values
   ----------------------------- */

const registerSchema = yup.object().shape({
    firstName: yup.string().required("required"),
    lastName: yup.string().required("required"),
    email: yup.string().email("invalid email").required("required"),
    password: yup.string().required("required"),
    location: yup.string().required("required"),
    occupation: yup.string().required("required"),
    picture: yup.mixed().required("required"),
});

const loginSchema = yup.object().shape({
    email: yup.string().email("invalid email").required("required"),
    password: yup.string().required("required"),
});

const initialValuesRegister = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    location: "",
    occupation: "",
    picture: null,
};

const initialValuesLogin = {
    email: "",
    password: "",
};

/* -----------------------------
   Component
   ----------------------------- */

const Form = () => {
    const [pageType, setPageType] = useState("login");
    const { palette } = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const isLogin = pageType === "login";
    const isRegister = pageType === "register";

    /* -------- register handler -------- */
    const register = async (values, formikHelpers) => {
        try {
            const formData = new FormData();
            formData.append("firstName", values.firstName);
            formData.append("lastName", values.lastName);
            formData.append("email", values.email);
            formData.append("password", values.password);
            formData.append("location", values.location);
            formData.append("occupation", values.occupation);

            if (values.picture) {
                // Ensure field name matches your server's multer field name (often "picture")
                formData.append("picture", values.picture);
                formData.append("picturePath", values.picture.name);
            }

            const response = await fetch("http://localhost:3001/auth/register", {
                method: "POST",
                // DO NOT set Content-Type when sending FormData
                // If your server relies on cookies/auth, uncomment credentials:
                // credentials: "include",
                body: formData,
            });

            // If response is not ok, read plain text and show it for debugging
            if (!response.ok) {
                // Try to read text (server may return HTML or JSON error)
                let text;
                try {
                    text = await response.text();
                } catch (err) {
                    text = `Unable to read response body: ${err.message}`;
                }
                console.error("Register failed:", response.status, text);
                // Provide a helpful message to the user
                alert(
                    `Registration failed (${response.status}). See console for server message.`
                );
                formikHelpers.setSubmitting(false);
                return;
            }

            // If OK: try to parse JSON safely
            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                const savedUser = await response.json();
                formikHelpers.resetForm();
                // After successful registration, switch to login page
                if (savedUser) {
                    setPageType("login");
                }
            } else {
                // OK but not JSON (rare). Log text and proceed to login screen.
                const text = await response.text().catch(() => null);
                console.warn("Register succeeded but response is not JSON:", text);
                formikHelpers.resetForm();
                setPageType("login");
            }
        } catch (err) {
            console.error("Register error:", err);
            alert("An error occurred during registration. See console for details.");
            formikHelpers.setSubmitting(false);
        }
    };

    /* -------- login handler -------- */
    const login = async (values, formikHelpers) => {
        try {
            const response = await fetch("http://localhost:3001/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // credentials: "include", // uncomment if server requires cookies
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => null);
                console.error("Login failed:", response.status, text);
                alert(`Login failed (${response.status}). Check credentials or server.`);
                formikHelpers.setSubmitting(false);
                return;
            }

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                const text = await response.text().catch(() => null);
                console.error("Login returned non-JSON response:", text);
                alert("Login server returned unexpected response. See console.");
                formikHelpers.setSubmitting(false);
                return;
            }

            const loggedIn = await response.json();
            formikHelpers.resetForm();
            if (loggedIn) {
                dispatch(
                    setLogin({
                        user: loggedIn.user,
                        token: loggedIn.token,
                    })
                );
                navigate("/home");
            }
        } catch (err) {
            console.error("Login error:", err);
            alert("An error occurred during login. See console for details.");
            formikHelpers.setSubmitting(false);
        }
    };

    const handleFormSubmit = async (values, formikHelpers) => {
        formikHelpers.setSubmitting(true);
        if (isLogin) await login(values, formikHelpers);
        if (isRegister) await register(values, formikHelpers);
        formikHelpers.setSubmitting(false);
    };

    /* -----------------------------
       Formik form
       ----------------------------- */
    return (
        <Formik
            onSubmit={handleFormSubmit}
            initialValues={isLogin ? initialValuesLogin : initialValuesRegister}
            validationSchema={isLogin ? loginSchema : registerSchema}
            enableReinitialize
        >
            {({
                values,
                errors,
                touched,
                handleBlur,
                handleChange,
                handleSubmit,
                setFieldValue,
                resetForm,
                isSubmitting,
            }) => (
                <form onSubmit={handleSubmit}>
                    <Box
                        display="grid"
                        gap="30px"
                        gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                        sx={{
                            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                        }}
                    >
                        {isRegister && (
                            <>
                                <TextField
                                    label="First Name"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={values.firstName}
                                    name="firstName"
                                    error={Boolean(touched.firstName) && Boolean(errors.firstName)}
                                    helperText={touched.firstName && errors.firstName}
                                    sx={{ gridColumn: "span 2" }}
                                />
                                <TextField
                                    label="Last Name"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={values.lastName}
                                    name="lastName"
                                    error={Boolean(touched.lastName) && Boolean(errors.lastName)}
                                    helperText={touched.lastName && errors.lastName}
                                    sx={{ gridColumn: "span 2" }}
                                />
                                <TextField
                                    label="Location"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={values.location}
                                    name="location"
                                    error={Boolean(touched.location) && Boolean(errors.location)}
                                    helperText={touched.location && errors.location}
                                    sx={{ gridColumn: "span 4" }}
                                />
                                <TextField
                                    label="Occupation"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={values.occupation}
                                    name="occupation"
                                    error={Boolean(touched.occupation) && Boolean(errors.occupation)}
                                    helperText={touched.occupation && errors.occupation}
                                    sx={{ gridColumn: "span 4" }}
                                />
                                <Box
                                    gridColumn="span 4"
                                    border={`1px solid ${palette.neutral?.medium ?? "#ddd"}`}
                                    borderRadius="5px"
                                    p="1rem"
                                >
                                    <Dropzone
                                        acceptedFiles=".jpg,.jpeg,.png"
                                        multiple={false}
                                        onDrop={(acceptedFiles) => {
                                            setFieldValue("picture", acceptedFiles[0] ?? null);
                                        }}
                                    >
                                        {({ getRootProps, getInputProps }) => (
                                            <Box
                                                {...getRootProps()}
                                                border={`2px dashed ${palette.primary?.main ?? "#1976d2"}`}
                                                p="1rem"
                                                sx={{ "&:hover": { cursor: "pointer" } }}
                                            >
                                                <input {...getInputProps()} />
                                                {!values.picture ? (
                                                    <p>Add Picture Here</p>
                                                ) : (
                                                    <FlexBetween>
                                                        <Typography>{values.picture.name}</Typography>
                                                        <EditOutlinedIcon />
                                                    </FlexBetween>
                                                )}
                                            </Box>
                                        )}
                                    </Dropzone>
                                </Box>
                            </>
                        )}

                        <TextField
                            label="Email"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            value={values.email}
                            name="email"
                            error={Boolean(touched.email) && Boolean(errors.email)}
                            helperText={touched.email && errors.email}
                            sx={{ gridColumn: "span 4" }}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            value={values.password}
                            name="password"
                            error={Boolean(touched.password) && Boolean(errors.password)}
                            helperText={touched.password && errors.password}
                            sx={{ gridColumn: "span 4" }}
                        />
                    </Box>

                    {/* BUTTONS */}
                    <Box>
                        <Button
                            fullWidth
                            type="submit"
                            disabled={isSubmitting}
                            sx={{
                                m: "2rem 0",
                                p: "1rem",
                                backgroundColor: palette.primary.main,
                                color: palette.background.alt,
                                "&:hover": { color: palette.primary.main },
                            }}
                        >
                            {isLogin ? "LOGIN" : "REGISTER"}
                        </Button>

                        <Typography
                            onClick={() => {
                                setPageType(isLogin ? "register" : "login");
                                resetForm();
                            }}
                            sx={{
                                textDecoration: "underline",
                                color: palette.primary.main,
                                "&:hover": {
                                    cursor: "pointer",
                                    color: palette.primary.light,
                                },
                            }}
                        >
                            {isLogin
                                ? "Don't have an account? Sign Up here."
                                : "Already have an account? Login here."}
                        </Typography>
                    </Box>
                </form>
            )}
        </Formik>
    );
};

export default Form;