import Link from "next/link";
import React from "react";

const SignInPage = () => {
  return (
    <section className="bg-blue-theme">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center">
            <img src="/logoDark.png" width={100} alt="Logo" />
          </div>
          <h2 className="text-xl font-semibold text-black mt-2">LoremIpsum</h2>
        </div>
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Create your ID
            </h1>
            <form className="space-y-4 md:space-y-6" action="#">
              <div className="flex w-full gap-3">
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="bg-gray-50 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  placeholder="First Name"
                  required
                />
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="bg-gray-50 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  placeholder="Last Name"
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="bg-gray-50 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  placeholder="Email"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Password"
                  className="bg-gray-50 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="remember"
                      aria-describedby="remember"
                      type="checkbox"
                      className="w-4 h-4 rounded-full bg-gray-50 border-2 border-gray-300 focus:ring-3 focus:ring-primary-300"
                      required
                    />
                  </div>

                  <div className="ml-3 text-sm">
                    <label htmlFor="remember" className="text-gray-500">
                      By proceeding, you agree to the
                      <span className="text-blue-bold">
                        Terms and Conditions
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full text-black bg-blue-theme hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-bold rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Sign up with email
              </button>
              <p className="text-sm font-light text-center text-gray-500">
                Already have an account?{" "}
                <Link
                  href={"/auth/login"}
                  className="font-bold hover:underline text-blue-bold"
                >
                  Login Now
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignInPage;
