import {
  type ActionFunctionArgs,
  redirect,
  useActionData,
  useNavigation,
  Form,
} from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "../lib/firebase";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");

  if (!password) {
    return { error: { password: "Password is required" } };
  }

  try {
    await signInWithEmailAndPassword(auth, "admin@gmail.com", password);
    return redirect("/dashboard");
  } catch (error) {
    const code = (error as any).code;

    if (code === "auth/wrong-password") {
      return { error: { password: "Password is incorrect" } };
    } else {
      return {
        error: {
          internal: "An error occurred during sign in. Please try again later",
        },
      };
    }
  }
}

export function Component() {
  const actionData = useActionData() as Awaited<ReturnType<typeof action>>;
  const navigation = useNavigation();

  return (
    <>
      <h1>Sign in to Red CORAL</h1>
      {actionData?.error.internal && <p>{actionData.error.internal}</p>}
      <Form method="POST">
        <fieldset disabled={navigation.state === "loading"}>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" />
            {actionData?.error.password && <p>{actionData.error.password}</p>}
          </div>
          <button type="submit">Continue</button>
        </fieldset>
      </Form>
    </>
  );
}
