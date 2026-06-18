const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qdeexfjtzydxkfsdgodx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
