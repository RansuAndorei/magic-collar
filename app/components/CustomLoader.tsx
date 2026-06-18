import { LOGO_PATH } from "@/utils/constants";
import { Center, Flex, Loader } from "@mantine/core";
import Image from "next/image";

const CustomLoader = () => {
  return (
    <Center h="100vh">
      <Flex gap="xl" align="center">
        <Loader type="dots" size="md" />
        <Image alt="logo" width={100} height={44} src={LOGO_PATH} priority />
        <Loader type="dots" size="md" />
      </Flex>
    </Center>
  );
};

export default CustomLoader;
