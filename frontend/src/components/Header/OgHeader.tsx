"use client";

// Dependencies
import React, { Fragment, useEffect, useRef } from "react";
// import { useNavigate } from "react-router";
// import { useDispatch, useSelector } from "react-redux";
// import { Helmet } from "react-helmet-async";
// import { userLoaded } from "@/reducers/authActions";

// // Actions
// import { fetchMapItems } from "@/actions/MapItemActions";
// import { updateSelectedLanguage } from "@/actions/SelectedLanguageActions";
// import { fetchItemsToDownload, autoAddItemFromLocalStorage } from "@/actions/DownloadItemActions";
// import { updateOidcCookie, updateBaatInfo } from "@/actions/AuthenticationActions";

// Components
import { MainNavigation } from "@kartverket/geonorge-web-components/MainNavigation";
import "@kartverket/geonorge-web-components/index.css";
import { useSearchParams } from "next/navigation";
// import Cookies from 'js-cookie';
// import { getEnvironment } from "@/utils/runtimeConfig";
import dynamic from "next/dynamic";


const OgHeader = () => {
  const searchParams = useSearchParams();
  const searchText = searchParams.get("text");

  // const navigate = useNavigate();
  // const dispatch = useDispatch();

  // const { searchData, params } = layoutLoaderData;

  // // Redux store
  // const selectedLanguage = useSelector((state) => state.selectedLanguage);
  // const auth = useSelector((state) => state.auth);
  // const baatInfo = useSelector((state) => state.baatInfo);

  // // Refs
  // const userRef = useRef(null);
  // const lastSearchStringRef = useRef(searchData?.searchString || "");

  // // Keep the last non-empty search string so navigating away and back
  // // doesn't reopen the autocomplete popup.
  // if (searchData?.searchString) {
  //     lastSearchStringRef.current = searchData.searchString;
  // }

  // const handleSubmitSearch = (searchString, selectedType) => {
  //     searchString = searchString.toString();
  //     //searchString = searchString.replace(/[^a-å0-9- ]+/gi, ""); // Removes unwanted characters
  //     searchString = searchString.replace(/\s\s+/g, " "); // Remove redundant whitespace
  //     if (searchString.length > 1) {
  //         const isLoggedIn = !!auth?.user;
  //         const view = new URLSearchParams(window.location.search).get("view");
  //         const viewParam = view ? `&view=${view}` : "";
  //         if (isLoggedIn) {
  //             location.href = `/${selectedType}?text=${searchString}${viewParam}`;
  //         }
  //         else{
  //             navigate(`/${selectedType}?text=${searchString}${viewParam}`);
  //         }
  //     }
  // };

  // const handleChangeSearchResultsType = (searchResultsType, searchString) => {
  //     //searchString = searchString.replace(/[^a-å0-9- ]+/gi, ""); // Removes unwanted characters
  //     searchString = searchString.replace(/\s\s+/g, " "); // Remove redundant whitespace
  //     const view = new URLSearchParams(window.location.search).get("view");
  //     const viewParam = view ? `${searchString && searchString.length ? "&" : "?"}view=${view}` : "";
  //     const searchStringParameter = searchString && searchString.length ? `?text=${searchString}` : "";
  //     navigate(`/${searchResultsType}${searchStringParameter}${viewParam}`);
  // };

  // useEffect(() => {
  //     dispatch(fetchMapItems());
  //     dispatch(fetchItemsToDownload());
  //     dispatch(updateOidcCookie());
  //     dispatch(updateBaatInfo());
  //     dispatch(autoAddItemFromLocalStorage());
  // }, []);

  // useEffect(() => {
  //     userRef.current = auth?.user;
  // }, [auth]);

  // useEffect(() => {
  //     const onAccessTokenExpiring = () => {
  //         // Handle token expiring (e.g., show warning, trigger silent renew, etc.)
  //         userManager.signinSilent();
  //     };

  //     userManager.events.addAccessTokenExpiring(onAccessTokenExpiring);

  //     return () => {
  //         userManager.events.removeAccessTokenExpiring(onAccessTokenExpiring);
  //     };
  // }, [userManager]);

  // useEffect(() => {
  //     const onUserLoaded = (user) => {
  //         // Handle user loaded event (e.g., dispatch to Redux, log, etc.)
  //         dispatch(userLoaded(user));
  //     };

  //     userManager.events.addUserLoaded(onUserLoaded);

  //     return () => {
  //         userManager.events.removeUserLoaded(onUserLoaded);
  //     };
  // }, [userManager, dispatch]);

  // useEffect(() => {
  //     const isLoggedIn = !!auth?.user;
  //     const hasBaatInfo = !!baatInfo?.user;

  //     var loggedInCookie = Cookies.get('_loggedInOtherApp');
  //     var loggedInMenu = Cookies.get('_loggedIn');
  //     let autoRedirectPath = null;

  //     if(loggedInCookie === "true" && !isLoggedIn){
  //         sessionStorage.autoRedirectPath = window.location.pathname;
  //         userManager.signinRedirect();
  //     }
  //     else if(loggedInMenu == "false" && isLoggedIn){
  //         sessionStorage.autoRedirectPath = window.location.pathname;
  //         userManager.signoutRedirect();
  //     }
  //     else if(sessionStorage?.autoRedirectPath){
  //             autoRedirectPath = sessionStorage.autoRedirectPath;
  //     }

  //     if (isLoggedIn || hasBaatInfo) {
  //         dispatch(autoAddItemFromLocalStorage());
  //         dispatch(fetchItemsToDownload());
  //         dispatch(updateOidcCookie());
  //         dispatch(updateBaatInfo());
  //     }

  //     if(autoRedirectPath !== null){
  //         navigate(autoRedirectPath);
  //     }

  MainNavigation.setup("main-navigation", {
    onSearch: (event: { detail: { searchString: string } | null }) => {
      const searchEvent = event.detail || null;
      if (searchEvent) {
        console.log("hello");
        //handleSubmitSearch(searchEvent.searchString, params.searchResultsType);
      }
    },
    onSignInClick: (event: React.MouseEvent<HTMLInputElement>) => {
      event.preventDefault();
      //sessionStorage.autoRedirectPath = window.location.pathname;
      console.log("user clickec sign in!");
      //userManager.signinRedirect();
    },
    onSignOutClick: (event: React.MouseEvent<HTMLInputElement>) => {
      event.preventDefault();
      //sessionStorage.autoRedirectPath = window.location.pathname;
      if (isLocalhost) {
        //Cookies.set('_loggedIn', 'false');
      } else {
        //Cookies.set('_loggedIn', 'false', { domain: 'geonorge.no' });
      }
      console.log("sign out");
      //userManager.signoutRedirect({ id_token_hint: userRef?.current?.id_token });
      //userManager.removeUser();
    },
    onNorwegianLanguageSelect: async () => {
      console.log("set norwegian");
      //await dispatch(updateSelectedLanguage("no"));
      //window.location.reload();
    },
    onEnglishLanguageSelect: async () => {
      console.log("set english");
      //await dispatch(updateSelectedLanguage("en"));
      //window.location.reload();
    },
    onSearchTypeChange: (event: any) => {
      console.log("set search type");
      //const searchType = event?.detail?.value || null;
      //handleChangeSearchResultsType(searchType, lastSearchStringRef.current);
    },
    onMapItemsChange: (event: any) => {
      console.log("item changeds");
      //dispatch(fetchMapItems());
    },
    onDownloadItemsChange: (event: any) => {
      console.log("download items changed");
      //dispatch(fetchItemsToDownload());
    },
  });

  // const metadataResultsFound = searchData?.results?.metadata?.NumFound || 0;
  // const articlesResultsFound = searchData?.results?.articles?.NumFound || 0;

  const userinfo = {
    name: "Test Testesen",
    email: "test@testefjes.no",
  };

  const orginfo = {
    organizationNumber: 141414,
    organizationName: "Orgefjes",
  };

  const mainNavigationProps = {
    userinfo: JSON.stringify(userinfo),
    orginfo: JSON.stringify(orginfo),
    isLoggedIn: true,
    language: "no-NB",
    environment: "dev",
    searchString: searchText,
    searchType: "params.searchResultsType",
    showsearchtypeselector: false, //showSearchTypeSelector,
    metadataresultsfound: true,
    articlesresultsfound: true,
    maincontentid: "main-content",
    kartkatalogUrl: "localhost:3000",
  };
  return (
    <Fragment>
      {React.createElement("main-navigation", mainNavigationProps)}
    </Fragment>
  );
};

const isLocalhost = Boolean(
  true,
  // window.location.hostname === 'localhost' ||
  //   // [::1] is the IPv6 localhost address.
  //   window.location.hostname === '[::1]' ||
  //   // 127.0.0.1/8 is considered localhost for IPv4.
  //   window.location.hostname.match(
  //     /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  //   )
);

export default OgHeader;
