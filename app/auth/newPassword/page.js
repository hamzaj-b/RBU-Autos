import Link from "next/link";
import React from "react";

const SignInPage = () => {
  return (
    <section className="bg-yellow-primary">
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
              Create New Password
            </h1>
            <p className="text-gray-400">
              Please enter a new password. Your new password must be different
              from previous password.
            </p>
            <form className="space-y-4 md:space-y-6" action="#">
              <div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="New Password"
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Confirm New Password"
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full text-black bg-yellow-primary hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-bold rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Reset Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignInPage;
