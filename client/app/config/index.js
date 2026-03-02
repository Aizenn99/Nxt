export const registerFormControls = [
    {
        name: "username",
        label: "Username",
        type: "text",
        placeholder: "Enter your username",
        value: "",
        error: "",
        validation: {
            required: true,
            minLength: 3,
            maxLength: 20,
        },
    },
    {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "Enter your email",
        value: "",
        error: "",
        validation: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
    },
    {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "Enter your password",
        value: "",
        error: "",
        validation: {
            required: true,
            minLength: 6,
            maxLength: 20,
        },
    },
    {
        name: "confirmPassword",
        label: "Confirm Password",
        type: "password",
        placeholder: "Confirm your password",
        value: "",
        error: "",
        validation: {
            required: true,
            minLength: 6,
            maxLength: 20,
        },
    },

]

export const loginFormControls = [
    {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "Enter your email",
        value: "",
        error: "",
        validation: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
    },
    {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "Enter your password",
        value: "",
        error: "",
        validation: {
            required: true,
            minLength: 6,
            maxLength: 20,
        },
    },

]
